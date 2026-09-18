package services

import (
	"errors"
	"math"
	"strconv"
	"strings"

	"geoapp/internal/models"
	"github.com/restayway/gogis"
	"gorm.io/gorm"
)

type EntityService struct {
	db *gorm.DB
}

func NewEntityService(gdb *gorm.DB) *EntityService {
	return &EntityService{db: gdb}
}

func (s *EntityService) List(page, perPage int, entityType, status string) ([]models.Entity, int64, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}
	q := s.db.Model(&models.Entity{})
	if entityType != "" {
		q = q.Where("type = ?", entityType)
	}
	if status != "" {
		q = q.Where("status = ?", status)
	}
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var entities []models.Entity
	offset := (page - 1) * perPage
	if err := q.Order("created_at DESC").Offset(offset).Limit(perPage).Find(&entities).Error; err != nil {
		return nil, 0, err
	}
	return entities, total, nil
}

func (s *EntityService) GetByMap(bbox string, entityType, status string) ([]models.Entity, error) {
	parts := strings.Split(bbox, ",")
	if len(parts) != 4 {
		return nil, ErrBadBbox
	}
	minLng, err := strconv.ParseFloat(parts[0], 64)
	if err != nil {
		return nil, ErrBadBbox
	}
	minLat, err := strconv.ParseFloat(parts[1], 64)
	if err != nil {
		return nil, ErrBadBbox
	}
	maxLng, err := strconv.ParseFloat(parts[2], 64)
	if err != nil {
		return nil, ErrBadBbox
	}
	maxLat, err := strconv.ParseFloat(parts[3], 64)
	if err != nil {
		return nil, ErrBadBbox
	}
	q := s.db.Model(&models.Entity{}).Where(
		"ST_Within(location, ST_MakeEnvelope(?, ?, ?, ?, 4326))",
		minLng, minLat, maxLng, maxLat,
	)
	if entityType != "" {
		q = q.Where("type = ?", entityType)
	}
	if status != "" {
		q = q.Where("status = ?", status)
	}
	var entities []models.Entity
	if err := q.Find(&entities).Error; err != nil {
		return nil, err
	}
	return entities, nil
}

func (s *EntityService) GetByID(id string) (*models.Entity, error) {
	var entity models.Entity
	if err := s.db.Where("id = ?", id).First(&entity).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &entity, nil
}

func (s *EntityService) Create(in *models.EntityInput) (*models.Entity, error) {
	entity := in.ToModel()
	if err := s.db.Create(&entity).Error; err != nil {
		if isUniqueViolation(err) {
			return nil, ErrConflict
		}
		return nil, err
	}
	return &entity, nil
}

func (s *EntityService) Update(id string, in *models.EntityInput) (*models.Entity, error) {
	var entity models.Entity
	if err := s.db.Where("id = ?", id).First(&entity).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	entity.DeviceID = in.DeviceID
	entity.Name = in.Name
	entity.Type = in.Type
	entity.Status = in.Status
	desc := in.Description
	if desc != "" {
		entity.Description = &desc
	} else {
		entity.Description = nil
	}
	entity.Location = gogis.Point{Lat: in.Lat, Lng: in.Lng}
	entity.Attributes = in.Attributes
	if err := s.db.Save(&entity).Error; err != nil {
		if isUniqueViolation(err) {
			return nil, ErrConflict
		}
		return nil, err
	}
	return &entity, nil
}

func (s *EntityService) Delete(id string) (bool, error) {
	result := s.db.Where("id = ?", id).Delete(&models.Entity{})
	if result.Error != nil {
		return false, result.Error
	}
	return result.RowsAffected > 0, nil
}

var ErrConflict = errors.New("conflict")
var ErrBadBbox = errors.New("bbox must be 4 numeric values: minLng,minLat,maxLng,maxLat")

func isUniqueViolation(err error) bool {
	return strings.Contains(err.Error(), "unique constraint") ||
		strings.Contains(err.Error(), "duplicate key")
}

// PaginationMeta calculates last_page from total and per_page.
func CalcLastPage(total int64, perPage int) int {
	return int(math.Ceil(float64(total) / float64(perPage)))
}

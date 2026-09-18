package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"geoapp/internal/models"
	"geoapp/internal/services"
	"geoapp/internal/validation"
	"github.com/gin-gonic/gin"
)

type EntityHandler struct {
	svc *services.EntityService
}

func NewEntityHandler(svc *services.EntityService) *EntityHandler {
	return &EntityHandler{svc: svc}
}

func (h *EntityHandler) Register(r *gin.Engine) {
	api := r.Group("/api")
	api.GET("/entities", h.List)
	api.GET("/entities/map", h.Map)
	api.GET("/entities/:id", h.GetByID)
	api.POST("/entities", h.Create)
	api.PUT("/entities/:id", h.Update)
	api.DELETE("/entities/:id", h.Delete)
}

func (h *EntityHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}
	entityType := c.Query("type")
	status := c.Query("status")

	entities, total, err := h.svc.List(page, perPage, entityType, status)
	if err != nil {
		ServerError(c)
		return
	}

	data := make([]map[string]interface{}, len(entities))
	for i, e := range entities {
		data[i] = e.ToJSON()
	}

	lastPage := services.CalcLastPage(total, perPage)
	c.JSON(http.StatusOK, Response{
		StatusCode: http.StatusOK,
		Message:    "OK",
		Data:       data,
		Meta: &PaginationMeta{
			CurrentPage: page,
			LastPage:    lastPage,
			PerPage:     perPage,
			Total:       int(total),
		},
	})
}

func (h *EntityHandler) Map(c *gin.Context) {
	bbox := c.Query("bbox")
	if bbox == "" {
		BadRequest(c, "bbox query param is required (minLng,minLat,maxLng,maxLat)")
		return
	}
	entityType := c.Query("type")
	status := c.Query("status")

	entities, err := h.svc.GetByMap(bbox, entityType, status)
	if err != nil {
		if errors.Is(err, services.ErrBadBbox) {
			BadRequest(c, err.Error())
			return
		}
		ServerError(c)
		return
	}

	data := make([]map[string]interface{}, len(entities))
	for i, e := range entities {
		data[i] = e.ToJSON()
	}
	OK(c, data)
}

func (h *EntityHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	entity, err := h.svc.GetByID(id)
	if err != nil {
		ServerError(c)
		return
	}
	if entity == nil {
		NotFound(c, "entity not found")
		return
	}
	OK(c, entity.ToJSON())
}

func (h *EntityHandler) Create(c *gin.Context) {
	var in models.EntityInput
	if err := c.ShouldBindJSON(&in); err != nil {
		fieldErrors := validation.FormatValidationErrors(err)
		if len(fieldErrors) > 0 {
			ValidationError(c, fieldErrors)
			return
		}
		BadRequest(c, "invalid JSON body")
		return
	}
	entity, err := h.svc.Create(&in)
	if err != nil {
		if errors.Is(err, services.ErrConflict) {
			ConflictError(c, map[string]string{"device_id": "device_id already exists"})
			return
		}
		ServerError(c)
		return
	}
	Created(c, entity.ToJSON())
}

func (h *EntityHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var in models.EntityInput
	if err := c.ShouldBindJSON(&in); err != nil {
		fieldErrors := validation.FormatValidationErrors(err)
		if len(fieldErrors) > 0 {
			ValidationError(c, fieldErrors)
			return
		}
		BadRequest(c, "invalid JSON body")
		return
	}
	entity, err := h.svc.Update(id, &in)
	if err != nil {
		if errors.Is(err, services.ErrConflict) {
			ConflictError(c, map[string]string{"device_id": "device_id already exists"})
			return
		}
		ServerError(c)
		return
	}
	if entity == nil {
		NotFound(c, "entity not found")
		return
	}
	OK(c, entity.ToJSON())
}

func (h *EntityHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	deleted, err := h.svc.Delete(id)
	if err != nil {
		ServerError(c)
		return
	}
	if !deleted {
		NotFound(c, "entity not found")
		return
	}
	NoContent(c)
}

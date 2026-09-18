package models

import (
	"time"

	"github.com/restayway/gogis"
)

// Entity is the GORM model. Location is stored as geometry(Point, 4326)
// via gogis.Point but serialized as lat/lng in JSON.
type Entity struct {
	ID          string                 `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	DeviceID    string                 `gorm:"column:device_id;type:varchar(100);uniqueIndex" json:"device_id"`
	Name        string                 `gorm:"type:varchar(100)"                        json:"name"`
	Type        string                 `gorm:"type:varchar(20)"                        json:"type"`
	Status      string                 `gorm:"type:varchar(20)"                        json:"status"`
	Description *string                `gorm:"type:varchar(500)"                       json:"description"`
	Location    gogis.Point            `gorm:"type:geometry(Point,4326)"               json:"-"`
	Attributes  map[string]interface{} `gorm:"type:jsonb;serializer:json"            json:"attributes"`
	CreatedAt   time.Time              `json:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at"`
}

func (Entity) TableName() string { return "entities" }

// ToJSON converts the model to the flat JSON shape (lat/lng instead of location).
func (e *Entity) ToJSON() map[string]interface{} {
	desc := ""
	if e.Description != nil {
		desc = *e.Description
	}
	attrs := e.Attributes
	if attrs == nil {
		attrs = map[string]interface{}{}
	}
	return map[string]interface{}{
		"id":          e.ID,
		"device_id":   e.DeviceID,
		"name":        e.Name,
		"type":        e.Type,
		"status":      e.Status,
		"description": desc,
		"lat":         e.Location.Lat,
		"lng":         e.Location.Lng,
		"attributes":  attrs,
		"created_at":  e.CreatedAt.Format(time.RFC3339),
		"updated_at":  e.UpdatedAt.Format(time.RFC3339),
	}
}

// EntityInput is the request body for create/update.
type EntityInput struct {
	DeviceID    string                 `json:"device_id"   binding:"required,min=1,max=100"`
	Name        string                 `json:"name"        binding:"required,min=1,max=100"`
	Type        string                 `json:"type"        binding:"required,oneof=vehicle iot facility other"`
	Status      string                 `json:"status"      binding:"required,oneof=active inactive maintenance"`
	Description string                 `json:"description" binding:"omitempty,max=500"`
	Lat         float64                `json:"lat"         binding:"required,lat"`
	Lng         float64                `json:"lng"         binding:"required,lng"`
	Attributes  map[string]interface{} `json:"attributes"`
}

// ToModel converts an EntityInput into an Entity model (no ID/timestamps).
func (in *EntityInput) ToModel() Entity {
	desc := in.Description
	var descPtr *string
	if desc != "" {
		descPtr = &desc
	}
	return Entity{
		DeviceID:    in.DeviceID,
		Name:        in.Name,
		Type:        in.Type,
		Status:      in.Status,
		Description: descPtr,
		Location:    gogis.Point{Lat: in.Lat, Lng: in.Lng},
		Attributes:  in.Attributes,
	}
}

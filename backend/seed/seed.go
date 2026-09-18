package seed

import (
	"log"

	"geoapp/internal/models"

	"github.com/restayway/gogis"
	"gorm.io/gorm"
)

// IfEmpty inserts demo entities if the entities table is empty.
func IfEmpty(gdb *gorm.DB) {
	var count int64
	gdb.Model(&models.Entity{}).Count(&count)
	if count > 0 {
		return
	}
	log.Println("seeding demo entities...")

	entities := []models.Entity{
		{DeviceID: "VAN-01-NORTH", Name: "Delivery Van 01", Type: "vehicle", Status: "active", Description: strPtr("North route"), Location: gogis.Point{Lat: -6.2088, Lng: 106.8456}, Attributes: map[string]interface{}{"plate": "B 1234 X"}},
		{DeviceID: "VAN-02-SOUTH", Name: "Delivery Van 02", Type: "vehicle", Status: "maintenance", Description: strPtr("South route, in service"), Location: gogis.Point{Lat: -6.3000, Lng: 106.8000}, Attributes: map[string]interface{}{"plate": "B 5678 Y"}},
		{DeviceID: "IOT-TEMP-01", Name: "Temp Sensor 01", Type: "iot", Status: "active", Description: strPtr("Rooftop temperature sensor"), Location: gogis.Point{Lat: -6.2500, Lng: 106.8500}, Attributes: map[string]interface{}{"battery": 87}},
		{DeviceID: "IOT-HUMID-02", Name: "Humidity Sensor 02", Type: "iot", Status: "inactive", Description: strPtr("Offline since last week"), Location: gogis.Point{Lat: -6.1800, Lng: 106.9000}, Attributes: map[string]interface{}{"battery": 12}},
		{DeviceID: "FAC-WAREHOUSE", Name: "Main Warehouse", Type: "facility", Status: "active", Description: strPtr("Central distribution center"), Location: gogis.Point{Lat: -6.1500, Lng: 106.7800}, Attributes: map[string]interface{}{"capacity": 5000}},
		{DeviceID: "MISC-001", Name: "Untracked Unit", Type: "other", Status: "inactive", Location: gogis.Point{Lat: -6.2200, Lng: 106.8700}},
	}

	for _, e := range entities {
		if err := gdb.Create(&e).Error; err != nil {
			log.Printf("seed error for %s: %v", e.DeviceID, err)
		}
	}
	log.Println("seeding complete")
}

func strPtr(s string) *string { return &s }

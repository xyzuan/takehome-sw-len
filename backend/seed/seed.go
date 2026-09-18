package seed

import (
	"fmt"
	"log"
	"math/rand"

	"geoapp/internal/models"

	"github.com/restayway/gogis"
	"gorm.io/gorm"
)

func IfEmpty(gdb *gorm.DB) {
	var count int64
	gdb.Model(&models.Entity{}).Count(&count)
	if count > 0 {
		return
	}
	log.Println("seeding 1000 demo entities around Bandung...")

	// Bandung center: -6.9147, 107.6098
	// Spread entities within ~15km radius
	centerLat := -6.9147
	centerLng := 107.6098

	types := []string{"vehicle", "iot", "facility", "other"}
	statuses := []string{"active", "inactive", "maintenance"}
	vehicleNames := []string{"Delivery Van", "Truck", "Motorcycle Courier", "Service Car", "Transport Bus"}
	iotNames := []string{"Temperature Sensor", "Humidity Sensor", "Air Quality Monitor", "Traffic Camera", "GPS Tracker"}
	facilityNames := []string{"Warehouse", "Office", "Factory", "Distribution Center", "Service Station"}
	otherNames := []string{"Equipment Unit", "Field Unit", "Mobile Station", "Test Device"}

	for i := 0; i < 1000; i++ {
		// Random offset within ~0.15 degrees (~15km)
		lat := centerLat + (rand.Float64()-0.5)*0.3
		lng := centerLng + (rand.Float64()-0.5)*0.3

		t := types[rand.Intn(len(types))]
		var name, desc string
		switch t {
		case "vehicle":
			name = fmt.Sprintf("%s %03d", vehicleNames[rand.Intn(len(vehicleNames))], i+1)
			desc = fmt.Sprintf("Route %03d", rand.Intn(900)+100)
		case "iot":
			name = fmt.Sprintf("%s %03d", iotNames[rand.Intn(len(iotNames))], i+1)
			desc = fmt.Sprintf("Battery: %d%%", rand.Intn(100))
		case "facility":
			name = fmt.Sprintf("%s %03d", facilityNames[rand.Intn(len(facilityNames))], i+1)
			desc = fmt.Sprintf("Capacity: %d units", rand.Intn(5000)+100)
		default:
			name = fmt.Sprintf("%s %03d", otherNames[rand.Intn(len(otherNames))], i+1)
			desc = ""
		}

		var descPtr *string
		if desc != "" {
			descPtr = &desc
		}

		status := statuses[rand.Intn(len(statuses))]

		entity := models.Entity{
			DeviceID:    fmt.Sprintf("DEV-%05d", i+1),
			Name:        name,
			Type:        t,
			Status:      status,
			Description: descPtr,
			Location:    gogis.Point{Lat: lat, Lng: lng},
		}

		if err := gdb.Create(&entity).Error; err != nil {
			log.Printf("seed error for %s: %v", entity.DeviceID, err)
		}
	}
	log.Println("seeding complete: 1000 entities")
}

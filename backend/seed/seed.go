package seed

import (
	"fmt"
	"log"
	"math"
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
	log.Println("seeding 100 demo entities around Bandung (circular distribution)...")

	// PT Len Industri center
	centerLat := -6.9495
	centerLng := 107.6195

	types := []string{"vehicle", "iot", "facility", "other"}
	statuses := []string{"active", "inactive", "maintenance"}
	vehicleNames := []string{"Delivery Van", "Truck", "Motorcycle Courier", "Service Car", "Transport Bus"}
	iotNames := []string{"Temperature Sensor", "Humidity Sensor", "Air Quality Monitor", "Traffic Camera", "GPS Tracker"}
	facilityNames := []string{"Warehouse", "Office", "Factory", "Distribution Center", "Service Station"}
	otherNames := []string{"Equipment Unit", "Field Unit", "Mobile Station", "Test Device"}

	for i := 0; i < 100; i++ {
		// Circular distribution: random angle + random radius up to ~10km
		angle := rand.Float64() * 2 * math.Pi
		// 1 degree lat ≈ 111km, so 0.09 degrees ≈ 10km
		radius := 0.02 + rand.Float64()*0.07 // 2-9km radius
		lat := centerLat + radius*math.Sin(angle)
		lng := centerLng + radius*math.Cos(angle)/math.Cos(centerLat*math.Pi/180) // adjust for longitude scaling

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

		entity := models.Entity{
			DeviceID:    fmt.Sprintf("DEV-%04d", i+1),
			Name:        name,
			Type:        t,
			Status:      statuses[rand.Intn(len(statuses))],
			Description: descPtr,
			Location:    gogis.Point{Lat: lat, Lng: lng},
		}

		if err := gdb.Create(&entity).Error; err != nil {
			log.Printf("seed error for %s: %v", entity.DeviceID, err)
		}
	}
	log.Println("seeding complete: 100 entities in circular distribution around Bandung")
}

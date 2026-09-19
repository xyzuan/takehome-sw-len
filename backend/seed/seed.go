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
	vehicleBrands := []string{"Toyota", "Mitsubishi", "Isuzu", "Hino", "Suzuki"}
	vehicleModels := []string{"Hilux", "Canter", "Elf", "Dutro", "Carry"}

	iotNames := []string{"Temperature Sensor", "Humidity Sensor", "Air Quality Monitor", "Traffic Camera", "GPS Tracker"}
	iotBrands := []string{"Siemens", "Honeywell", "Bosch", "Schneider", "Libelium"}

	facilityNames := []string{"Warehouse", "Office", "Factory", "Distribution Center", "Service Station"}
	facilityBrands := []string{"PT Len Industri", "PT Pindad", "PT Dirgantara", "PT Krakatau Steel", "PT Telekomunikasi"}

	otherNames := []string{"Equipment Unit", "Field Unit", "Mobile Station", "Test Device"}
	otherBrands := []string{"Fluke", "Tektronix", "Keysight", "Rohde & Schwarz"}

	for i := 0; i < 100; i++ {
		// Circular distribution: random angle + random radius up to ~10km
		angle := rand.Float64() * 2 * math.Pi
		// 1 degree lat ≈ 111km, so 0.09 degrees ≈ 10km
		radius := 0.02 + rand.Float64()*0.07 // 2-9km radius
		lat := centerLat + radius*math.Sin(angle)
		lng := centerLng + radius*math.Cos(angle)/math.Cos(centerLat*math.Pi/180) // adjust for longitude scaling

		t := types[rand.Intn(len(types))]
		var name, desc string
		var attrs map[string]interface{}

		switch t {
		case "vehicle":
			brand := vehicleBrands[rand.Intn(len(vehicleBrands))]
			model := vehicleModels[rand.Intn(len(vehicleModels))]
			name = fmt.Sprintf("%s %s %03d", vehicleNames[rand.Intn(len(vehicleNames))], model, i+1)
			desc = fmt.Sprintf("%s %s, Fleet vehicle managed by PT Len Industri", brand, model)
			attrs = map[string]interface{}{
				"brand":         brand,
				"model":         model,
				"fuel_level":    fmt.Sprintf("%d%%", rand.Intn(101)),
				"mileage_km":    fmt.Sprintf("%d", rand.Intn(200000)+1000),
				"license_plate": fmt.Sprintf("B %d %s", rand.Intn(9000)+1000, randomLetters(3)),
				"driver":        randomDriver(),
				"last_service":  randomDate(),
			}
		case "iot":
			brand := iotBrands[rand.Intn(len(iotBrands))]
			name = fmt.Sprintf("%s %03d", iotNames[rand.Intn(len(iotNames))], i+1)
			desc = fmt.Sprintf("%s sensor unit for industrial monitoring", brand)
			attrs = map[string]interface{}{
				"brand":           brand,
				"firmware":        fmt.Sprintf("v%d.%d.%d", rand.Intn(3)+1, rand.Intn(10), rand.Intn(10)),
				"battery":         fmt.Sprintf("%d%%", rand.Intn(101)),
				"signal_strength": fmt.Sprintf("%d dBm", -(rand.Intn(50) + 30)),
				"last_reading":    fmt.Sprintf("%.1f", rand.Float64()*100),
				"interval_sec":    fmt.Sprintf("%d", (rand.Intn(5)+1)*60),
				"protocol":        randomChoice([]string{"LoRaWAN", "MQTT", "NB-IoT", "Zigbee"}),
			}
		case "facility":
			brand := facilityBrands[rand.Intn(len(facilityBrands))]
			name = fmt.Sprintf("%s %03d", facilityNames[rand.Intn(len(facilityNames))], i+1)
			desc = fmt.Sprintf("%s facility, operated by %s", randomChoice([]string{"Primary", "Secondary", "Auxiliary", "Regional"}), brand)
			attrs = map[string]interface{}{
				"operator":      brand,
				"capacity":      fmt.Sprintf("%d units", rand.Intn(5000)+100),
				"area_sqm":       fmt.Sprintf("%d", rand.Intn(10000)+500),
				"floors":        fmt.Sprintf("%d", rand.Intn(5)+1),
				"manager":        randomDriver(),
				"opening_hours":  "07:00-17:00 WIB",
				"year_built":     fmt.Sprintf("%d", rand.Intn(25)+2000),
			}
		default:
			brand := otherBrands[rand.Intn(len(otherBrands))]
			name = fmt.Sprintf("%s %03d", otherNames[rand.Intn(len(otherNames))], i+1)
			desc = fmt.Sprintf("%s equipment for field operations", brand)
			attrs = map[string]interface{}{
				"brand":        brand,
				"serial":       fmt.Sprintf("SN-%s-%d", randomLetters(4), rand.Intn(9000)+1000),
				"calibrated":   randomDate(),
				"condition":    randomChoice([]string{"Good", "Fair", "Excellent", "Needs Repair"}),
				"assigned_to":  randomDriver(),
				"location_id":  fmt.Sprintf("LOC-%d", rand.Intn(999)+1),
			}
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
			Attributes:  attrs,
		}

		if err := gdb.Create(&entity).Error; err != nil {
			log.Printf("seed error for %s: %v", entity.DeviceID, err)
		}
	}
	log.Println("seeding complete: 100 entities in circular distribution around Bandung")
}

var letterRunes = []rune("ABCDEFGHJKLMNPRSTUVWXYZ")

func randomLetters(n int) string {
	b := make([]rune, n)
	for i := range b {
		b[i] = letterRunes[rand.Intn(len(letterRunes))]
	}
	return string(b)
}

var drivers = []string{"Andi Wijaya", "Budi Santoso", "Citra Lestari", "Dewi Anggraini", "Eko Prasetyo", "Fajar Nugroho", "Gita Maharani", "Hadi Kusuma"}

func randomDriver() string {
	return drivers[rand.Intn(len(drivers))]
}

func randomDate() string {
	y := rand.Intn(5) + 2020
	m := rand.Intn(12) + 1
	d := rand.Intn(28) + 1
	return fmt.Sprintf("%04d-%02d-%02d", y, m, d)
}

func randomChoice(opts []string) string {
	return opts[rand.Intn(len(opts))]
}

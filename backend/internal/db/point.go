package db

import (
	"context"
	"database/sql"
	"database/sql/driver"
	"fmt"
	"strconv"
	"strings"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// Point holds a geographic coordinate. In the DB it is stored as
// geography(Point, 4326). In JSON it is flattened to lat/lng by the model.
type Point struct {
	Lat float64
	Lng float64
}

// GormDataType tells GORM the column type.
func (Point) GormDataType() string {
	return "geography(Point,4326)"
}

// GormValue produces the SQL expression for INSERT/UPDATE.
func (p Point) GormValue(ctx context.Context, db *gorm.DB) clause.Expr {
	return clause.Expr{
		SQL:  "ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography",
		Vars: []interface{}{p.Lng, p.Lat},
	}
}

// Scan reads EWKT ("SRID=4326;POINT(lng lat)") from the DB into the struct.
func (p *Point) Scan(src interface{}) error {
	var ewkt string
	switch v := src.(type) {
	case string:
		ewkt = v
	case []byte:
		ewkt = string(v)
	default:
		return fmt.Errorf("point: cannot scan %T", src)
	}
	// Parse "SRID=4326;POINT(lng lat)" or "POINT(lng lat)"
	ewkt = strings.TrimPrefix(ewkt, "SRID=4326;")
	ewkt = strings.TrimPrefix(ewkt, "POINT(")
	ewkt = strings.TrimSuffix(ewkt, ")")
	parts := strings.Fields(ewkt)
	if len(parts) != 2 {
		return fmt.Errorf("point: bad EWKT %q", src)
	}
	lng, err := strconv.ParseFloat(parts[0], 64)
	if err != nil {
		return err
	}
	lat, err := strconv.ParseFloat(parts[1], 64)
	if err != nil {
		return err
	}
	p.Lng = lng
	p.Lat = lat
	return nil
}

// Value is a fallback for driver.Valuer (not normally used since GormValue
// takes precedence, but keeps the type usable in raw queries).
func (p Point) Value() (driver.Value, error) {
	return fmt.Sprintf("SRID=4326;POINT(%f %f)", p.Lng, p.Lat), nil
}

// Ensure Point implements sql.Scanner at compile time.
var _ sql.Scanner = (*Point)(nil)

package db

import (
	"embed"
	"fmt"
	"log"
	"regexp"
	"sort"
	"strconv"

	"gorm.io/gorm"
)

//go:embed migrations/*.sql
var migrationFS embed.FS

// Migrate runs pending up-migrations in order. Tracks applied versions
// in a schema_migrations table. This is NOT GORM AutoMigrate.
func Migrate(gdb *gorm.DB) error {
	if err := gdb.Exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
		version INTEGER PRIMARY KEY,
		applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	)`).Error; err != nil {
		return fmt.Errorf("create schema_migrations: %w", err)
	}

	// Get applied versions
	type row struct{ Version int }
	var applied []row
	if err := gdb.Table("schema_migrations").Find(&applied).Error; err != nil {
		return err
	}
	appliedMap := map[int]bool{}
	for _, r := range applied {
		appliedMap[r.Version] = true
	}

	// List up-migration files
	entries, err := migrationFS.ReadDir("migrations")
	if err != nil {
		return err
	}
	upRe := regexp.MustCompile(`^(\d+)_.*\.up\.sql$`)
	var versions []int
	fileByVersion := map[int]string{}
	for _, e := range entries {
		if m := upRe.FindStringSubmatch(e.Name()); m != nil {
			v, _ := strconv.Atoi(m[1])
			versions = append(versions, v)
			fileByVersion[v] = e.Name()
		}
	}
	sort.Ints(versions)

	for _, v := range versions {
		if appliedMap[v] {
			continue
		}
		sqlBytes, err := migrationFS.ReadFile("migrations/" + fileByVersion[v])
		if err != nil {
			return err
		}
		log.Printf("running migration %d: %s", v, fileByVersion[v])
		if err := gdb.Exec(string(sqlBytes)).Error; err != nil {
			return fmt.Errorf("migration %d: %w", v, err)
		}
		if err := gdb.Exec("INSERT INTO schema_migrations (version) VALUES (?)", v).Error; err != nil {
			return err
		}
	}
	log.Println("migrations complete")
	return nil
}

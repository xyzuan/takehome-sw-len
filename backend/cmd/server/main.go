package main

import (
	"log"
	"net/http"

	"geoapp/internal/config"
	"geoapp/internal/db"
	"geoapp/internal/validation"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	gdb, err := db.Connect(cfg)
	if err != nil {
		log.Fatal(err)
	}
	if err := db.Migrate(gdb); err != nil {
		log.Fatal(err)
	}

	validation.RegisterWithGin()

	r := gin.Default()
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	log.Printf("server starting on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}

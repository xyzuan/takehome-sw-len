package main

import (
	"log"
	"net/http"

	"geoapp/internal/config"
	"geoapp/internal/db"
	"geoapp/internal/handlers"
	"geoapp/internal/services"
	"geoapp/internal/validation"
	"geoapp/seed"

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
	seed.IfEmpty(gdb)

	validation.RegisterWithGin()

	r := gin.Default()
	r.Use(corsMiddleware())

	svc := services.NewEntityService(gdb)
	h := handlers.NewEntityHandler(svc)
	h.Register(r)

	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	log.Printf("server starting on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}

package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Response struct {
	StatusCode int                    `json:"status_code"`
	Message    string                 `json:"message"`
	Data       interface{}            `json:"data"`
	Meta       *PaginationMeta        `json:"meta,omitempty"`
	Errors     map[string]string      `json:"errors,omitempty"`
}

type PaginationMeta struct {
	CurrentPage int `json:"current_page"`
	LastPage    int `json:"last_page"`
	PerPage     int `json:"per_page"`
	Total       int `json:"total"`
}

func OK(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, Response{
		StatusCode: http.StatusOK,
		Message:    "OK",
		Data:       data,
	})
}

func Created(c *gin.Context, data interface{}) {
	c.JSON(http.StatusCreated, Response{
		StatusCode: http.StatusCreated,
		Message:    "Created",
		Data:       data,
	})
}

func NoContent(c *gin.Context) {
	c.Status(http.StatusNoContent)
}

func NotFound(c *gin.Context, msg string) {
	c.JSON(http.StatusNotFound, Response{
		StatusCode: http.StatusNotFound,
		Message:    msg,
		Data:       nil,
	})
}

func BadRequest(c *gin.Context, msg string) {
	c.JSON(http.StatusBadRequest, Response{
		StatusCode: http.StatusBadRequest,
		Message:    msg,
		Data:       nil,
	})
}

func ValidationError(c *gin.Context, errors map[string]string) {
	c.JSON(http.StatusUnprocessableEntity, Response{
		StatusCode: http.StatusUnprocessableEntity,
		Message:    "validation failed",
		Data:       nil,
		Errors:     errors,
	})
}

func ConflictError(c *gin.Context, errors map[string]string) {
	c.JSON(http.StatusConflict, Response{
		StatusCode: http.StatusConflict,
		Message:    "conflict",
		Data:       nil,
		Errors:     errors,
	})
}

func ServerError(c *gin.Context) {
	c.JSON(http.StatusInternalServerError, Response{
		StatusCode: http.StatusInternalServerError,
		Message:    "internal server error",
		Data:       nil,
	})
}

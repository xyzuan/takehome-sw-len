package validation

import (
	"fmt"
	"strings"

	"github.com/go-playground/validator/v10"
)

// fieldLabels maps snake_case field names to human-readable labels.
var fieldLabels = map[string]string{
	"device_id":   "Device ID",
	"name":        "Name",
	"type":        "Type",
	"status":      "Status",
	"description": "Description",
	"lat":         "Latitude",
	"lng":         "Longitude",
}

func label(field string) string {
	if l, ok := fieldLabels[field]; ok {
		return l
	}
	return field
}

// RegisterLatLng adds custom validators for latitude and longitude ranges.
func RegisterLatLng(v *validator.Validate) {
	_ = v.RegisterValidation("lat", func(fl validator.FieldLevel) bool {
		val := fl.Field().Float()
		return val >= -90 && val <= 90
	})
	_ = v.RegisterValidation("lng", func(fl validator.FieldLevel) bool {
		val := fl.Field().Float()
		return val >= -180 && val <= 180
	})
}

// FormatValidationErrors converts validator.ValidationErrors into a
// map[field]message for the API error response.
func FormatValidationErrors(err error) map[string]string {
	errors := map[string]string{}
	if ves, ok := err.(validator.ValidationErrors); ok {
		for _, fe := range ves {
			field := fe.Field()
			tag := fe.Tag()
			l := label(field)
			switch tag {
			case "required":
				errors[field] = fmt.Sprintf("%s is required", l)
			case "oneof":
				errors[field] = fmt.Sprintf("%s must be one of: %s", l, strings.ReplaceAll(fe.Param(), " ", ", "))
			case "min":
				errors[field] = fmt.Sprintf("%s must be at least %s characters", l, fe.Param())
			case "max":
				errors[field] = fmt.Sprintf("%s must be at most %s characters", l, fe.Param())
			case "lat":
				errors[field] = fmt.Sprintf("%s must be between -90 and 90", l)
			case "lng":
				errors[field] = fmt.Sprintf("%s must be between -180 and 180", l)
			default:
				errors[field] = fmt.Sprintf("%s is invalid", l)
			}
		}
	}
	return errors
}

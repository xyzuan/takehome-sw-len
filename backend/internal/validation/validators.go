package validation

import (
	"fmt"

	"github.com/go-playground/validator/v10"
)

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
			switch tag {
			case "required":
				errors[field] = fmt.Sprintf("%s is required", field)
			case "oneof":
				errors[field] = fmt.Sprintf("%s must be one of: %s", field, fe.Param())
			case "min":
				errors[field] = fmt.Sprintf("%s must be at least %s characters", field, fe.Param())
			case "max":
				errors[field] = fmt.Sprintf("%s must be at most %s characters", field, fe.Param())
			case "lat":
				errors[field] = "lat must be between -90 and 90"
			case "lng":
				errors[field] = "lng must be between -180 and 180"
			default:
				errors[field] = fmt.Sprintf("%s failed validation: %s", field, tag)
			}
		}
	}
	return errors
}

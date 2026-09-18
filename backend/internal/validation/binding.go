package validation

import (
	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
)

type customValidator struct {
	v *validator.Validate
}

func (cv *customValidator) ValidateStruct(obj interface{}) error {
	return cv.v.Struct(obj)
}

func (cv *customValidator) Engine() interface{} {
	return cv.v
}

// RegisterWithGin replaces Gin's default validator with one that knows
// about the custom lat/lng validators.
func RegisterWithGin() {
	v := validator.New()
	RegisterLatLng(v)
	binding.Validator = &customValidator{v: v}
}

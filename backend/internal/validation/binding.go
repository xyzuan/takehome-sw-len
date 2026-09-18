package validation

import (
	"reflect"
	"strings"

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
// about the custom lat/lng validators. A TagNameFunc is registered so that
// validation error keys use the json tag name (snake_case) instead of the
// Go struct field name (PascalCase).
func RegisterWithGin() {
	v := validator.New()
	v.SetTagName("binding")
	v.RegisterTagNameFunc(func(fld reflect.StructField) string {
		name := strings.SplitN(fld.Tag.Get("json"), ",", 2)[0]
		if name == "-" {
			return ""
		}
		return name
	})
	RegisterLatLng(v)
	binding.Validator = &customValidator{v: v}
}

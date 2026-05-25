package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Blog struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Title       string             `bson:"title" json:"title" binding:"required"`
	Slug        string             `bson:"slug" json:"slug" binding:"required"`
	Description string             `bson:"description" json:"description" binding:"required"`
	Content     string             `bson:"content" json:"content" binding:"required"`
	Author      string             `bson:"author" json:"author" binding:"required"`
	Category    string             `bson:"category" json:"category" binding:"required"`
	Image       string             `bson:"image" json:"image"`
	Keywords    []string           `bson:"keywords" json:"keywords"`
	CreatedAt   time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time          `bson:"updated_at" json:"updated_at"`
	Published   bool               `bson:"published" json:"published"`
}

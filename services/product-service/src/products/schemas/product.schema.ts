import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  category: string;

  @Prop({ default: 0 })
  stock: number;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: true })
  isAvailable: boolean;

  @Prop()
  imageUrl?: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Add text index for search
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });

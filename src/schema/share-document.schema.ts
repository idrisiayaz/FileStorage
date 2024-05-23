import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { FORM_MODEL, Form } from "./form.schema";

@Schema()
export class Share {
    @Prop()
    shared_by: string;

    @Prop()
    shared_to: string;

    @Prop({type: Types.ObjectId, ref: FORM_MODEL,required: true})
    document_id: Types.ObjectId | Form;
}

export type shareDocument = Share & Document;

export const SHARE_DOC_MODEL = Share.name;

export const ShareDocumentSchema = SchemaFactory.createForClass(Share);

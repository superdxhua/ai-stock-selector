import { relations } from "drizzle-orm/relations";
import { stockTrackingRecords, experienceSummaries, failureReflections, trackingObservations } from "./schema";

export const experienceSummariesRelations = relations(experienceSummaries, ({one}) => ({
	stockTrackingRecord: one(stockTrackingRecords, {
		fields: [experienceSummaries.trackingRecordId],
		references: [stockTrackingRecords.id]
	}),
}));

export const stockTrackingRecordsRelations = relations(stockTrackingRecords, ({many}) => ({
	experienceSummaries: many(experienceSummaries),
	failureReflections: many(failureReflections),
	trackingObservations: many(trackingObservations),
}));

export const failureReflectionsRelations = relations(failureReflections, ({one}) => ({
	stockTrackingRecord: one(stockTrackingRecords, {
		fields: [failureReflections.trackingRecordId],
		references: [stockTrackingRecords.id]
	}),
}));

export const trackingObservationsRelations = relations(trackingObservations, ({one}) => ({
	stockTrackingRecord: one(stockTrackingRecords, {
		fields: [trackingObservations.trackingRecordId],
		references: [stockTrackingRecords.id]
	}),
}));
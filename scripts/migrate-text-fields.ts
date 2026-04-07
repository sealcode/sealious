import type { App } from "../src/main.js";
import type Collection from "../src/chip-types/collection.js";
import type Field from "../src/chip-types/field.js";
import TextStorage from "../src/app/base-chips/field-types/text-storage.js";

type LegacyTextFormat = { original: string; safe: string };
type TextStorageFormat = string | LegacyTextFormat;

function isTextStorageField(field: Field<any, any, any>): boolean {
	return field instanceof TextStorage;
}

function hasLegacyFormat(value: any): value is LegacyTextFormat {
	return (
		value !== null &&
		typeof value === "object" &&
		"original" in value &&
		"safe" in value &&
		typeof value.original === "string"
	);
}

export async function migrateTextFields(app: App): Promise<void> {
	const context = new app.SuperContext();
	const collections = Object.values(app.collections);

	let totalMigrated = 0;

	for (const collection of collections) {
		const textFields: string[] = [];

		for (const [fieldName, field] of Object.entries(collection.fields)) {
			if (isTextStorageField(field)) {
				textFields.push(fieldName);
			}
		}

		if (textFields.length === 0) {
			continue;
		}

		app.Logger.info(
			"MIGRATION",
			`Processing collection '${collection.name}' with ${textFields.length} text field(s): ${textFields.join(", ")}`
		);

		let collectionMigrated = 0;
		let skip = 0;
		const batchSize = 100;

		while (true) {
			const documents = await app.Datastore.find(
				collection.name,
				{},
				{ limit: batchSize, skip },
				{}
			);

			if (documents.length === 0) {
				break;
			}

			for (const doc of documents) {
				const updates: Record<string, string> = {};
				let needsUpdate = false;

				for (const fieldName of textFields) {
					const fieldValue = doc[fieldName];

					if (hasLegacyFormat(fieldValue)) {
						updates[fieldName] = fieldValue.original;
						needsUpdate = true;
					}
				}

				if (needsUpdate) {
					await app.Datastore.update(
						collection.name,
						{ id: doc.id },
						{ $set: updates }
					);
					collectionMigrated++;
				}
			}

			skip += batchSize;

			if (documents.length < batchSize) {
				break;
			}
		}

		if (collectionMigrated > 0) {
			app.Logger.info(
				"MIGRATION",
				`Migrated ${collectionMigrated} document(s) in collection '${collection.name}'`
			);
			totalMigrated += collectionMigrated;
		}
	}

	if (totalMigrated > 0) {
		app.Logger.info(
			"MIGRATION",
			`Migration complete. Total documents migrated: ${totalMigrated}`
		);
	} else {
		app.Logger.info("MIGRATION", "No documents needed migration.");
	}
}

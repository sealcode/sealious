const assert = require("assert");
const { create_resource_as } = require("../test_utils");

describe("Access-strategy single_reference", () => {
	it("allows to add admin and regular to regular-single-reference collection", () =>
		create_resource_as({
			collection: "regular-single-reference",
			resource: {
				user: TEST_CONFIG.USERS.ADMIN.ID,
			},
		})
			.then(regular_single_reference =>
				assert(regular_single_reference.id)
			)
			.then(() =>
				create_resource_as({
					collection: "regular-single-reference",
					resource: {
						user: TEST_CONFIG.USERS.REGULAR.ID,
					},
				})
			)
			.then(regular_single_reference =>
				assert(regular_single_reference.id)
			));

	it("allows to add only admin to filter-single-reference collection", () =>
		create_resource_as({
			collection: "filter-single-reference",
			resource: {
				user: TEST_CONFIG.USERS.ADMIN.ID,
			},
		}).then(regular_single_reference =>
			assert(regular_single_reference.id)
		));

	it("doesn't allow to add a regular to filter-single-reference collection", () =>
		create_resource_as({
			collection: "filter-single-reference",
			resource: {
				user: TEST_CONFIG.USERS.REGULAR.ID,
			},
		})
			.then(resp => console.log(resp))
			.catch(e =>
				assert.deepEqual(
					e.response.data.data.user.message,
					"Nie masz dostępu do danego zasobu z kolekcji users lub on nie istnieje."
				)
			));
});

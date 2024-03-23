import Graph from "./graph.js";
import * as assert from "assert";

describe("graph", () => {
	let graph: Graph;
	beforeEach(() => {
		graph = new Graph();
	});

	it("Adding nodes and edges works correctly", () => {
		graph.addNode(1, 0);
		graph.addNode(2, 0);
		graph.addNode(3, 0);
		graph.addNode(4, 0);
		graph.addNode(5, 1);
		graph.addNode(6, 1);
		graph.addNode(7, 0);
		graph.addEdge(2, 3);
		graph.addEdge(2, 4);
		graph.addEdge(4, 5);
		graph.addEdge(6, 7);

		assert.deepEqual(graph.adjacency_matrix, [
			[0, 0, 0, 0, 0, 0, 0],
			[0, 0, 1, 1, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 1, 0, 0],
			[0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 1],
			[0, 0, 0, 0, 0, 0, 0],
		]);
	});

	// L1       M3  +----L4----+
	//  +           |          |
	//  |           |          |
	//  v           v          v
	// M2           L5        M6
	//                         +
	//                         |
	//                         v
	//                        M7

	it("Correctly runs best-first search on simple graph", () => {
		graph.addNode("L1", 1);
		graph.addNode("M2", 0);
		graph.addNode("M3", 0);
		graph.addNode("L4", 1);
		graph.addNode("L5", 1);
		graph.addNode("M6", 0);
		graph.addNode("M7", 0);
		graph.addEdge("L1", "M2");
		graph.addEdge("L4", "L5");
		graph.addEdge("L4", "M6");
		graph.addEdge("M6", "M7");

		assert.deepEqual(
			["M3", "L1", "M2", "L4", "M6", "M7", "L5"],
			graph.bestFirstSearch()
		);
	});

	//       L1       M5           L6           +-----L12----+
	//        +                    +            |            |
	//        |                    |            |            |
	//        v                    v            v            v
	// +-----L2----+         +-----O7-----+     M13         L14
	// |           |         |            |                  +
	// |           |         |            |                  |
	// v           v         v            v                  v
	// M3          M4    +---L8---+       M11               M15
	//                   |        |
	//                   v        v
	//                   M9      M10

	it("Correctly runs best-first search on complex graph", () => {
		graph.addNode("L1", 1);
		graph.addNode("L2", 1);
		graph.addNode("M3", 0);
		graph.addNode("M4", 0);
		graph.addNode("M5", 0);
		graph.addNode("L6", 1);
		graph.addNode("O7", 2);
		graph.addNode("L8", 1);
		graph.addNode("M9", 0);
		graph.addNode("M10", 0);
		graph.addNode("M11", 0);
		graph.addNode("L12", 1);
		graph.addNode("M13", 0);
		graph.addNode("L14", 1);
		graph.addNode("M15", 0);
		graph.addEdge("L1", "L2");
		graph.addEdge("L2", "M3");
		graph.addEdge("L2", "M4");
		graph.addEdge("L6", "O7");
		graph.addEdge("O7", "L8");
		graph.addEdge("L8", "M9");
		graph.addEdge("L8", "M10");
		graph.addEdge("O7", "M11");
		graph.addEdge("L12", "M13");
		graph.addEdge("L12", "L14");
		graph.addEdge("L14", "M15");

		const expectedOrder = [
			"M5",
			"L12",
			"M13",
			"L14",
			"M15",
			"L1",
			"L2",
			"M3",
			"M4",
			"L6",
			"O7",
			"M11",
			"L8",
			"M9",
			"M10",
		];
		assert.deepEqual(expectedOrder, graph.bestFirstSearch());
	});
});

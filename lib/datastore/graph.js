class Graph {
	constructor() {
		this.adjacency_matrix = [];
		this.node_ids = [];
		this.nodes = [];
		this.indexes = [];
	}
	addNode(id, priority) {
		this.adjacency_matrix.push(Array(this.getNoOfNodes()).fill(0));
		for (const row of this.adjacency_matrix) {
			row.push(0);
		}
		this.node_ids.push(id);
		this.nodes.push({ id, priority });
		this.indexes.push(this.nodes.length - 1);
	}
	getNoOfNodes() {
		return this.nodes.length;
	}
	addEdge(id_i, id_j) {
		const [i, j] = this._getIndexesOfNodePair(id_i, id_j);
		this.adjacency_matrix[i][j] = 1;
	}
	_getIndexesOfNodePair(id_i, id_j) {
		return [this.node_ids.indexOf(id_i), this.node_ids.indexOf(id_j)];
	}
	pathExists(id_i, id_j) {
		const [i, j] = this._getIndexesOfNodePair(id_i, id_j);
		return this._pathExists(i, j);
	}
	_pathExists(i, j) {
		if (this.adjacency_matrix[i][j]) {
			return true;
		}
		for (let k = 0; k < this.getNoOfNodes(); ++k) {
			if (this.adjacency_matrix[i][k]) {
				return this._pathExists(k, j);
			}
		}
		return false;
	}
	bestFirstSearch() {
		this.front = [];
		this.visited = [];
		while (this.visited.length < this.nodes.length) {
			const { front_node, next_node } = this._getNextNode();
			this.visited.push(next_node);

			if (front_node !== null) {
				if (this._areAllSuccessorsVisited(front_node)) {
					const index = this.front.indexOf(front_node);
					this.front.splice(index, 1);
				}
			}

			if (!this._areAllSuccessorsVisited(next_node)) {
				this.front.push(next_node);
			}
		}
		return this.visited.map(i => this.nodes[i].id);
	}
	_areAllSuccessorsVisited(i) {
		for (let j = 0; j < this.nodes.length; ++j) {
			if (this.adjacency_matrix[i][j] && !this._isVisited(j)) {
				return false;
			}
		}
		return true;
	}
	_isVisited(i) {
		return this.visited.includes(i);
	}
	_isNodeWithoutPredecessors(i) {
		for (let j = 0; j < this.nodes.length; ++j) {
			if (this.adjacency_matrix[j][i]) {
				return false;
			}
		}
		return true;
	}
	_getNextNode() {
		const nodesWithoutPredecessorsYetToBeVisited = this.indexes.filter(
			i => this._isNodeWithoutPredecessors(i) && !this._isVisited(i)
		);

		const candidate1 = this._lookForNextNodeInCandidates(
			nodesWithoutPredecessorsYetToBeVisited
		);
		if (candidate1.priority === Graph.MAX_PRIORITY) {
			return { front_node: null, next_node: candidate1.index };
		}

		const successorsYetToBeVisited = this.front.reduce((successors, i) => {
			this.indexes
				.filter(j => this.adjacency_matrix[i][j] && !this._isVisited(j))
				.map(j => successors.add(j));
			return successors;
		}, new Set());

		const candidate2 = this._lookForNextNodeInCandidates(
			successorsYetToBeVisited
		);

		if (candidate1.priority < candidate2.priority) {
			return { front_node: null, next_node: candidate1.index };
		}

		if (candidate1.priority === candidate2.priority) {
			if (
				candidate1.mean_priority_of_succcessors <
				candidate2.mean_priority_of_succcessors
			) {
				return { front_node: null, next_node: candidate1.index };
			}
		}

		const front_node = this.indexes.find(
			i => this.adjacency_matrix[i][candidate2.index]
		);
		return { front_node, next_node: candidate2.index };
	}
	_lookForNextNodeInCandidates(candidates) {
		let next_node = null,
			best_priority = Infinity,
			current_mean,
			best_mean = Infinity;
		for (const candidate of candidates) {
			if (this.nodes[candidate].priority < best_priority) {
				best_priority = this.nodes[candidate].priority;
				best_mean = this._meanPriorityOfSuccessors(candidate);
				next_node = candidate;
				if (this.nodes[candidate].priority === Graph.MAX_PRIORITY) {
					break;
				}
			} else if (this.nodes[candidate].priority === best_priority) {
				current_mean = this._meanPriorityOfSuccessors(candidate);
				if (current_mean < best_mean) {
					best_mean = current_mean;
					next_node = candidate;
				}
			}
		}
		return {
			index: next_node,
			priority: best_priority,
			mean_priority_of_succcessors: best_mean,
		};
	}
	_meanPriorityOfSuccessors(i) {
		let sum = 0,
			length = 0;
		for (let j of this.indexes) {
			if (this.adjacency_matrix[i][j] && !this._isVisited(j)) {
				sum += this.nodes[j].priority;
				++length;
			}
		}
		return length > 0 ? sum / length : 0;
	}
}

Graph.MAX_PRIORITY = 0;

module.exports = Graph;

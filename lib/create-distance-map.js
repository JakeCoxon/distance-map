import PriorityQueue from 'js-priority-queue'

const comparator = (a, b) => a.cost - b.cost;

const createDistanceMap = (getNeighbours, targets) => {

    if (!getNeighbours) throw new Error("Invalid getNeighbours to createDistanceMap")


    const distanceMap = new Map();
    
    targets.forEach((target) => {
        if (!target) throw new Error("targets must be an array of objects with the shape { node, cost }");
        const { node, cost } = target;
        if (!node || typeof cost == 'undefined') throw new Error("targets must be an array of objects with the shape { node, cost }")
        distanceMap.set(node, cost || 0);
    });

    const queue = new PriorityQueue({ comparator, initialValues: targets });

    while (queue.length) {
        const { node } = queue.dequeue();
        const oldCost = distanceMap.get(node);

        const neighbours = getNeighbours(node);

        neighbours.forEach(neighbour => {

            if (!neighbour.node || typeof neighbour.cost == 'undefined') throw new Error("getNeighbours must return an array of objects with the shape { node, cost }")
            if (neighbour.cost <= 0) throw new Error("Neighbour cost cannot be zero or less");

            const newCost = oldCost + neighbour.cost;

            if (distanceMap.get(neighbour.node) === undefined ||
                    distanceMap.get(neighbour.node) > newCost) {

                distanceMap.set(neighbour.node, newCost);
                queue.queue({ node: neighbour.node, cost: newCost });

            }

        });
    }

    return distanceMap;


}

export default createDistanceMap;



const getNearest = (array) => {

    let nearest = undefined, lowestCost = Infinity;
    array.forEach(neighbour => {

        if (neighbour.cost < lowestCost) {
            nearest = neighbour;
            lowestCost = neighbour.cost;
        }

    })
    return nearest;
}

const findShortestPath = (distanceMap, startNode, getNeighbours) => {

    const path = [];

    let tail = { node: startNode };

    while (tail !== undefined) {

        const tailCost = distanceMap.get(tail.node);
        const neighbours = getNeighbours(tail.node);
        const neighboursTotalCost = neighbours
            .map(n => ({ ...n, totalCost: distanceMap.get(n.node) }))
            .filter(n => n.totalCost < tailCost);

        const nearest = getNearest(neighboursTotalCost);

        tail = nearest;
        if (nearest) {
            path.push(nearest);
        }

    }

    return path;

}

export default findShortestPath;
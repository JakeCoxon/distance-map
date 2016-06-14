

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

const getPath = (distanceMap, startNode, getNeighbours) => {

    const path = [];

    let tail = { node: startNode };

    while (tail !== undefined) {

        const tailCost = distanceMap.get(tail.node);
        const neighbours = getNeighbours(tail.node);
        const neighboursTotalCost = neighbours
            .map(n => ({ node: n.node, cost: distanceMap.get(n.node) }))
            .filter(n => n.cost < tailCost);

        const nearest = getNearest(neighboursTotalCost);

        tail = nearest;
        if (nearest) {
            path.push(nearest);
        }

    }

    return path;

}

export default getPath;
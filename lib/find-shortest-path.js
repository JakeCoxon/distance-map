"use strict";

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

Object.defineProperty(exports, "__esModule", {
    value: true
});

var getNearest = function getNearest(array) {

    var nearest = undefined,
        lowestCost = Infinity;
    array.forEach(function (neighbour) {

        if (neighbour.cost < lowestCost) {
            nearest = neighbour;
            lowestCost = neighbour.cost;
        }
    });
    return nearest;
};

var findShortestPath = function findShortestPath(distanceMap, startNode, getNeighbours) {

    var path = [];

    var tail = { node: startNode };

    var _loop = function _loop() {

        var tailCost = distanceMap.get(tail.node);
        var neighbours = getNeighbours(tail.node);
        var neighboursTotalCost = neighbours.map(function (n) {
            return _extends({}, n, { totalCost: distanceMap.get(n.node) });
        }).filter(function (n) {
            return n.totalCost < tailCost;
        });

        var nearest = getNearest(neighboursTotalCost);

        tail = nearest;
        if (nearest) {
            path.push(nearest);
        }
    };

    while (tail !== undefined) {
        _loop();
    }

    return path;
};

exports.default = findShortestPath;
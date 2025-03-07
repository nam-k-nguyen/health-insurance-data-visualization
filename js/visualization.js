class Visualization {
    constructor(_attribute, _data, _geoData, _config = {}) {
        this.data = _data;
        this.geoData = _geoData;

        this.timeoutA = null;
        this.timeoutB = null;

        this.attribute = _attribute;
        this.config = {
            histElementA: _config.histElementA || "#histogram-a",
            histElementB: _config.histElementB || "#histogram-b",
            mapElementA: _config.mapElementA || "#choropleth-map-a",
            mapElementB: _config.mapElementB || "#choropleth-map-b",
            scatterElement: _config.scatterElement || "#scatterplot",
        }
        this.initVis()
    }

    handleBrushA(selectionA) {
        let vis = this;
        if (this.scatter.brushing) return;
        vis.scatter.moveBrushA(selectionA)

        if (vis.timeoutA) { clearTimeout(vis.timeoutA); }
        vis.timeoutA = setTimeout(() => {
            vis.mapA.updateSelection(selectionA);
        }, 100);
    }

    handleBrushB(selectionB) {
        let vis = this;
        if (this.scatter.brushing) return;
        vis.scatter.moveBrushB(selectionB)


        if (vis.timeoutB) { clearTimeout(vis.timeoutB); }
        vis.timeoutB = setTimeout(() => {
            vis.mapB.updateSelection(selectionB);
        }, 100);
    }

    handleBrushAB(selectionAttrA, selectionAttrB) {
        let vis = this;

        if (vis.timeoutA) { clearTimeout(vis.timeoutA); }
        vis.timeoutA = setTimeout(() => {
            vis.mapA.updateSelection(selectionAttrA);
        }, 100);

        if (vis.timeoutB) { clearTimeout(vis.timeoutB); }
        vis.timeoutB = setTimeout(() => {
            vis.mapB.updateSelection(selectionAttrB);
        }, 100);

        vis.histA.moveBrush(selectionAttrA);
        vis.histB.moveBrush(selectionAttrB);
    }

    initVis() {
        let vis = this;
        let { histElementA, histElementB, mapElementA, mapElementB, scatterElement } = vis.config;
        let attribute = vis.attribute;

        this.updateTitles()

        vis.histA = new Histogram(vis.data, attribute["A"], this.handleBrushA.bind(this), {
            parentElement: histElementA,
        });

        vis.histB = new Histogram(vis.data, attribute["B"], this.handleBrushB.bind(this), {
            parentElement: histElementB,
        });

        vis.mapA = new ChoroplethMap(vis.geoData, attribute["A"], this.handleBrushA.bind(this), {
            parentElement: mapElementA,
        });

        vis.mapB = new ChoroplethMap(vis.geoData, attribute["B"], this.handleBrushB.bind(this), {
            parentElement: mapElementB,
        });

        vis.scatter = new Scatterplot(vis.data, attribute["A"], attribute["B"], this.handleBrushAB.bind(this), {
            parentElement: scatterElement,
        });
    }

    updateTitles() {
        let vis = this;
        let A = visDescriptionLookup[vis.attribute["A"]];
        let B = visDescriptionLookup[vis.attribute["B"]];

        const apply = (selection, color, background) =>  {
            selection.style("color", color)
            selection.style("background-color", background)
        }

        apply(d3.select("#histSlotA").text(A.title), A.color, A.background)
        apply(d3.select("#histSlotB").text(B.title), B.color, B.background)
        apply(d3.select("#scatterSlotA").text(A.title), A.color, A.background)
        apply(d3.select("#scatterSlotB").text(B.title), B.color, B.background)
        
        apply(d3.select("#map-title-a .dropdown-arrow"), A.color, A.background)
        apply(d3.select("#map-title-a select"), A.color, A.background)
        apply(d3.select("#map-title-b .dropdown-arrow"), B.color, B.background)
        apply(d3.select("#map-title-b select"), B.color, B.background)
    }

    updateVisAttributeA(newAttributeA) {
        let vis = this;
        vis.attribute["A"] = newAttributeA;
        vis.histA.updateAttribute(newAttributeA);
        vis.scatter.updateAttributes(newAttributeA, vis.attribute["B"]);
        vis.mapA.updateAttribute(newAttributeA);
    }

    updateVisAttributeB(newAttributeB) {
        let vis = this;
        vis.attribute["B"] = newAttributeB;
        vis.histB.updateAttribute(newAttributeB);
        vis.scatter.updateAttributes(vis.attribute["A"], newAttributeB);
        vis.mapB.updateAttribute(newAttributeB);
    }
}
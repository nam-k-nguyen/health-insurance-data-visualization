class Scatterplot {
    constructor(_data, _attr_x, _attr_y, _handleBrush, _config = {}) {
        let _scale = _config.scale || 90;
        this.config = {
            scale: _scale,
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || _scale * 5,
            containerHeight: _config.containerHeight || _scale * 2,
            margin: _config.margin || { top: 20, right: 20, bottom: 50, left: 60 },
            tooltipPadding: 10,
            legendBottom: 50,
            legendLeft: 50,
            legendRectHeight: 12,
            legendRectWidth: 150
        }
        this.data = _data;
        this.attr_x = _attr_x;
        this.attr_y = _attr_y;
        this.externalBrush = false;
        this.handleBrush = _handleBrush
        this.selection = null;
        this.initVis();
    }

    initVis() {
        let vis = this;
        let { parentElement, containerHeight, containerWidth, margin } = vis.config;
        let { data, attr_x, attr_y } = vis;

        // svg

        vis.svg = d3.select(parentElement)
            .append("svg")
            .attr("width", containerWidth)
            .attr("height", containerHeight);

        // scales

        vis.x = d3.scaleLinear()
            .domain(d3.extent(data, d => d[attr_x]))
            .nice()
            .range([margin.left, containerWidth - margin.right]);

        vis.y = d3.scaleLinear()
            .domain(d3.extent(data, d => d[attr_y]))
            .nice()
            .range([containerHeight - margin.bottom, margin.top]);

        // brush

        vis.brushG = this.svg
            .append("g")
            .attr("class", "brush")

        vis.brush = d3.brush()
            .extent([[margin.left, margin.top], [containerWidth - margin.right, containerHeight - margin.bottom]])
            .on('brush', function ({ selection }) {
                if (selection) vis.brushed(selection);
            })
            .on('end', function ({ selection }) {
                if (!selection) vis.brushed(null);
            });

        // axes

        vis.xAxis = vis.svg
            .append("g")
            .attr("transform", `translate(0,${containerHeight - margin.bottom})`)
            .call(d3.axisBottom(vis.x).tickFormat(attr_x === "median_household_income" ? d3.format(".2s") : d => d));

        vis.xAxisTitle = vis.svg
            .append('text')
            .attr('class', 'x-axis-text')
            .attr('dy', '.35em')
            .attr("text-anchor", "middle")
            .attr("transform", `translate(${(containerWidth + margin.left - margin.right) / 2},${containerHeight - margin.bottom + margin.top + 10})`)
            .text(`${visDescriptionLookup[attr_x].axis}`)

        vis.yAxis = vis.svg
            .append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(vis.y).tickFormat(attr_y === "median_household_income" ? d3.format(".2s") : d => d));

        vis.yAxisTitle = vis.svg
            .append('text')
            .attr('class', 'y-axis-text')
            .attr('dy', '.35em')
            .attr("text-anchor", "middle")
            .attr("transform", `translate(${margin.left - 40},${(containerHeight + margin.top - margin.bottom) / 2}) rotate(-90)`)
            .text(`${visDescriptionLookup[attr_y].axis}`)
        vis.updateVis()
    }

    updateAttributes(newAttributeX, newAttributeY) {
        let vis = this;
        vis.attr_x = newAttributeX;
        vis.attr_y = newAttributeY;
        vis.updateVis();
    }

    updateVis() {
        let vis = this;
        let { data, attr_x, attr_y } = vis;
        let { containerHeight, containerWidth, margin } = vis.config;

        vis.x
            .domain(d3.extent(data, d => d[attr_x]))
            .nice()
            .range([margin.left, containerWidth - margin.right]);

        vis.y
            .domain(d3.extent(data, d => d[attr_y]))
            .nice()
            .range([containerHeight - margin.bottom, margin.top]);

        vis.renderVis();
    }

    renderVis() {
        let vis = this;
        let { data, attr_x, attr_y } = vis;
        let { tooltipPadding } = vis.config;

        vis.counties = vis.svg.selectAll("circle")
            .data(data)
            .join("circle")
            .attr("cx", d => vis.x(d[attr_x]))
            .attr("cy", d => vis.y(d[attr_y]))
            .attr("r", 2)
            .attr("stroke", "white")
            .attr("stroke-width", 0.2)
            .attr("opacity", 0.5)
            .attr("fill", "steelblue");

        vis.counties
            .on('mousemove', (event, d) => {
                const attr =
                    d[vis.attr_x] && d[vis.attr_y] ?
                        `<strong>${d[vis.attr_x]}</strong> ${visDescriptionLookup[vis.attr_x].tooltip}<br>
                        <strong>${d[vis.attr_y]}</strong> ${visDescriptionLookup[vis.attr_y].tooltip}`
                        : 'No data available';

                d3
                    .select('#tooltip')
                    .style('display', 'block')
                    .style('left', (event.pageX + tooltipPadding) + 'px')
                    .style('top', (event.pageY + tooltipPadding) + 'px')
                    .html(`
                        <div class="tooltip-title">${d.County}</div>
                        <div>${attr}</div>
                    `);
            })
            .on('mouseleave', () => {
                d3.select('#tooltip').style('display', 'none');
            });

        vis.xAxis.call(d3.axisBottom(vis.x).tickFormat(attr_x === "median_household_income" ? d3.format(".2s") : d => d));
        vis.yAxis.call(d3.axisLeft(vis.y).tickFormat(attr_y === "median_household_income" ? d3.format(".2s") : d => d));
        vis.xAxisTitle.text(`${visDescriptionLookup[attr_x].axis}`)
        vis.yAxisTitle.text(`${visDescriptionLookup[attr_y].axis}`)
        vis.brushG.call(vis.brush);
    }

    brushed(selection) {
        let vis = this;

        if (selection) {
            let xSelection = selection.map(d => vis.x.invert(d[0]));
            let ySelection = selection.map(d => vis.y.invert(d[1]));
            let [xLow, xHigh] = xSelection;
            let [yHigh, yLow] = ySelection;
            vis.counties.attr("fill", d => {
                let xInSelection = d[vis.attr_x] >= xLow && d[vis.attr_x] <= xHigh;
                let yInSelection = d[vis.attr_y] >= yLow && d[vis.attr_y] <= yHigh;
                let pointInSelection = xInSelection && yInSelection
                return pointInSelection ? "steelblue" : "lightgray";
            });
            if (!vis.externalBrush) {
                vis.handleBrush([xLow, xHigh], [yLow, yHigh])
            }
        } else {
            vis.selection = null;
            vis.counties.attr("fill", "steelblue");
            if (!vis.externalBrush) {
                vis.handleBrush(null)
            }
        }
        vis.externalBrush = false;
    }

    moveBrushA(selection) {
        let vis = this
        vis.externalBrush = true
        if (!selection) {
            vis.selection = null;
            vis.brushG.call(this.brush.move, null);
            return;
        }

        let [x0, x1] = [vis.x(selection[0]), vis.x(selection[1])];
        let [y1, y0] = vis.selection ? [vis.selection.y1, vis.selection.y0] : vis.y.range()

        vis.selection = { x0, x1, y0, y1 }
        vis.brushG.call(vis.brush.move, [[x0, y0], [x1, y1]]);
    }

    moveBrushB(selection) {
        let vis = this;
        vis.externalBrush = true
        if (!selection) {
            this.selection = null;
            this.brushG.call(this.brush.move, null);
            return;
        }

        let [y1, y0] = [vis.y(selection[0]), vis.y(selection[1])];
        let [x0, x1] = vis.selection ? [vis.selection.x0, vis.selection.x1] : vis.x.range()

        vis.selection = { x0, x1, y0, y1 }
        vis.brushG.call(vis.brush.move, [[x0, y0], [x1, y1]]);
    }
}

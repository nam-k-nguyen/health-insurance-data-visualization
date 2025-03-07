class Histogram {
    constructor(_data, _attr, _handleBrush, _config = {}) {

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
        this.attr = _attr;
        this.handleBrush = _handleBrush;
        this.externalBrush = false;
        this.initVis();
    }

    initVis() {
        let vis = this;
        let { data, attr } = vis;
        let { parentElement, containerHeight, containerWidth, margin } = vis.config;

        // Svg

        vis.svg = d3.select(parentElement)
            .append("svg")
            .attr("width", containerWidth)
            .attr("height", containerHeight);

        // Scales

        vis.x = d3.scaleLinear()
            .domain(d3.extent(data, d => d[attr]))
            .nice()
            .range([margin.left, containerWidth - margin.right]);

        vis.bins = d3.bin()
            .domain(vis.x.domain())
            .thresholds(20)(data.map(d => d[attr]))

        vis.y = d3.scaleLinear()
            .domain([0, d3.max(vis.bins, d => d.length)])
            .nice()
            .range([containerHeight - margin.bottom, margin.top]);

        // Brush

        vis.brushG = this.svg
            .append("g")
            .attr("class", "brush x-brush")

        vis.brush = d3.brushX()
            .extent([[margin.left, margin.top], [containerWidth - margin.right, containerHeight - margin.bottom]])
            .on('brush', function ({ selection }) {
                if (selection) vis.brushed(selection);
            })
            .on('end', function ({ selection }) {
                if (!selection) vis.brushed(null);
            });

        // Axes

        vis.xAxis = vis.svg
            .append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${containerHeight - margin.bottom})`)

        vis.xAxisTitle = vis.svg
            .append('text')
            .attr('class', 'x-axis-text')
            .attr('dy', '.35em')
            .attr("text-anchor", "middle")
            .attr("transform", `translate(${(containerWidth + margin.left - margin.right) / 2},${containerHeight - margin.bottom + margin.top + 10})`)
            .text(`${visDescriptionLookup[attr].axis}`)

        vis.yAxis = vis.svg
            .append("g")
            .attr("class", "y-axis")
            .attr("transform", `translate(${margin.left},0)`)

        vis.yAxisTitle = vis.svg
            .append('text')
            .attr('class', 'y-axis-text')
            .attr('dy', '.35em')
            .attr("text-anchor", "middle")
            .attr("transform", `translate(${margin.left - 50},${(containerHeight + margin.top - margin.bottom) / 2}), rotate(-90)`)
            .text("County Count")

        // Update

        vis.updateVis();
    }

    updateAttribute(newAttribute) {
        let vis = this;
        vis.attr = newAttribute;
        vis.updateVis();
    }

    updateVis() {
        let vis = this;
        let { data, attr } = vis;
        let { containerHeight, containerWidth, margin } = vis.config;

        vis.x
            .domain(d3.extent(data, d => d[attr]))
            .nice()
            .range([margin.left, containerWidth - margin.right]);

        vis.bins = d3.bin()
            .domain(vis.x.domain())
            .thresholds(100)(data.map(d => d[attr]));

        vis.y
            .domain([0, d3.max(vis.bins, d => d.length)])
            .nice()
            .range([containerHeight - margin.bottom, margin.top]);


        vis.renderVis();
    }

    renderVis() {
        let vis = this;
        let { attr } = vis;

        vis.bars = vis.svg
            .selectAll("rect.bar")
            .data(vis.bins)
            .join("rect")
            .attr("class", "bar")
            .attr("x", d => vis.x(d.x0))
            .attr("y", d => vis.y(d.length))
            .attr("width", d => vis.x(d.x1) - vis.x(d.x0) - 1)
            .attr("height", d => vis.y(0) - vis.y(d.length))
            .attr("fill", (d, i) => "#4682b4")

        vis.bars
            .on('mousemove', (event, d) => {
                const attr =
                    d.length ?
                        `<strong>${d.length}</strong> counties<br>
                        <strong>${d.x0}</strong> to <strong>${d.x1}</strong> ${visDescriptionLookup[vis.attr].tooltip}`
                        : 'No data available';

                d3
                    .select("#tooltip")
                    .style("display", "block")
                    .style("left", (event.pageX + vis.config.tooltipPadding) + "px")
                    .style("top", (event.pageY + vis.config.tooltipPadding) + "px")
                    .html(attr);
            })
            .on('mouseleave', () => {
                d3.select("#tooltip").style("display", "none");
            });

        vis.xAxis.call(d3.axisBottom(vis.x).tickFormat(attr === "median_household_income" ? d3.format(".2s") : d => d));
        vis.yAxis.call(d3.axisLeft(vis.y));
        vis.xAxisTitle.text(`${visDescriptionLookup[attr].axis}`)
        vis.brushG.call(vis.brush)
    }

    brushed(selection) {
        let vis = this;

        if (selection) {
            let s = vis.selection = selection.map(vis.x.invert, vis.x);
            vis.bars.attr("fill", d => d.x0 >= s[0] && d.x1 <= s[1] ? "steelblue" : "lightgray");
        } else {
            vis.selection = null;
            vis.bars.attr("fill", "steelblue");
        }

        if (!vis.externalBrush) {
            vis.handleBrush(vis.selection);
        }
        vis.externalBrush = false;
    }

    moveBrush(selection) {
        selection = selection.map(val => this.x(val))
        let vis = this;
        vis.externalBrush = true;
        if (!selection) {
            vis.selection = null;
            vis.brushG.call(vis.brush.move, null);
            return;
        }

        let [x0, x1] = [selection[0], selection[1]]

        vis.selection = { x0, x1 }
        vis.brushG.call(vis.brush.move, [x0, x1])
    }
}
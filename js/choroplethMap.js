class ChoroplethMap {

    /**
     * Class constructor with basic configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_data, _attr, _handleBrush, _config = {}) {

        let _scale = _config.scale || 150;
        this.config = {
            scale: _scale,
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || _scale * 5,
            containerHeight: _config.containerHeight || _scale * 3,
            margin: _config.margin || { top: 0, right: 60, bottom: 0, left: 10 },
            tooltipPadding: 10,
            legendVertical: { "top": 20 },
            legendHorizontal: { "right": 120 },
            legendRectHeight: 12,
            legendRectWidth: 150
        }
        this.data = _data;
        this.attr = _attr;
        this.handleBrush = _handleBrush
        this.selection = null;
        this.initVis();
    }

    initVis() {
        let vis = this;
        let { parentElement, containerWidth, containerHeight, margin, legendHorizontal, legendVertical, legendRectHeight, legendRectWidth } = vis.config;
        vis.width = containerWidth - margin.left - margin.right;
        vis.height = containerHeight - margin.top - margin.bottom;

        // Create SVG and group elements

        vis.svg = d3.select(parentElement).append('svg')
            .attr('width', containerWidth)
            .attr('height', containerHeight);

        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Project and path generator

        vis.projection = d3.geoAlbersUsa();
        vis.geoPath = d3.geoPath().projection(vis.projection);

        // Legend

        vis.colorScale = d3.scaleLinear()
            .range(['#cfe2f2', '#0d306b'])
            .interpolate(d3.interpolateHcl);

        vis.linearGradient = vis.svg.append('defs').append('linearGradient')
            .attr("id", "legend-gradient");

        vis.legend = vis.chart.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(
                ${legendHorizontal["right"] ? vis.width - legendHorizontal["right"] : legendHorizontal["left"]},
                ${legendVertical["top"] ? legendVertical["top"] : vis.height - legendVertical["bottom"]}
            )`);

        vis.legendRect = vis.legend.append('rect')
            .attr('width', legendRectWidth)
            .attr('height', legendRectHeight)

        vis.legendTitle = vis.legend.append('text')
            .attr('class', 'legend-title')
            .attr('dy', '.35em')
            .attr("text-anchor", legendHorizontal["left"] ? "start" : "end")
            .attr("transform", `translate(${legendHorizontal["left"] ? 0 : legendRectWidth},0)`)
            .attr('y', -10)

        vis.updateVis();
    }

    updateAttribute(newAttribute) {
        let vis = this;
        vis.attr = newAttribute;
        vis.updateVis();
    }

    updateSelection(selection) {
        let vis = this;
        vis.selection = selection;
        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        const attrExtent = d3.extent(vis.data.objects.counties.geometries, d => d.properties[vis.attr]);

        // Update color scale
        vis.colorScale.domain(attrExtent);

        // Define begin and end of the color gradient (legend)
        vis.legendStops = [
            { color: '#cfe2f2', value: attrExtent[0], offset: 0 },
            { color: '#0d306b', value: attrExtent[1], offset: 100 },
        ];
        vis.legendTitle.text(visDescriptionLookup[vis.attr].mapLegend);
        vis.renderVis();
    }


    renderVis() {
        let vis = this;
        let { tooltipPadding, legendRectWidth } = vis.config;

        // Convert compressed TopoJSON to GeoJSON format
        const countries = topojson.feature(vis.data, vis.data.objects.counties)

        // Defines the scale of the projection so that the geometry fits within the SVG area
        vis.projection.fitSize([vis.width, vis.height], countries);

        // Append world map
        const countryPath = vis.chart.selectAll('.country')
            .data(countries.features)
            .join('path')
            .attr('class', 'country')
            .attr('d', vis.geoPath)
            .attr('fill', d => {
                let value = d.properties[vis.attr];
                if (!vis.selection) {
                    return value ? vis.colorScale(value) : 'url(#lightstripe)'
                } else {
                    let [low, high] = vis.selection;
                    return value && value >= low && value <= high ? vis.colorScale(value) : 'url(#lightstripe)';
                }
            });

        countryPath
            .on('mousemove', (event, d) => {
                const attr = d.properties[vis.attr] ?
                    `<strong>${d.properties[vis.attr]}</strong> ${visDescriptionLookup[vis.attr].tooltip}`
                    : 'No data available';

                d3.select('#tooltip')
                    .style('display', 'block')
                    .style('left', (event.pageX + tooltipPadding) + 'px')
                    .style('top', (event.pageY + tooltipPadding) + 'px')
                    .html(`
                <div class="tooltip-title">${d.properties.name}</div>
                <div>${attr}</div>
              `);
            })
            .on('mouseleave', () => {
                d3.select('#tooltip').style('display', 'none');
            });

        // Add legend labels
        vis.legend.selectAll('.legend-label')
            .data(vis.legendStops)
            .join('text')
            .attr('class', 'legend-label')
            .attr('text-anchor', 'middle')
            .attr('dy', '.35em')
            .attr('y', 20)
            .attr('x', (d, index) => {
                return index == 0 ? 0 : legendRectWidth;
            })
            .text(d => Math.round(d.value * 10) / 10);

        // Update gradient for legend
        vis.linearGradient.selectAll('stop')
            .data(vis.legendStops)
            .join('stop')
            .attr('offset', d => d.offset)
            .attr('stop-color', d => d.color);

        vis.legendRect.attr('fill', 'url(#legend-gradient)');
    }
}
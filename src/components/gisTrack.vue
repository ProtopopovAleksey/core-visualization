<template>
  <div class="gis_block" :id="`gis-${track_num}`"></div>
</template>

<script>
  import * as d3 from "d3";
  import {mapState} from "vuex";
  import drawingMixin from "@/mixins/drawingMixin.js"
  import menuMixin from "@/mixins/menuMixin.js"
  
  export default {
    name: "gisTrack",
    props: [
      "line_data",
      "track_num",
      "height",
      "legendHeight",
      "kern_data",
      "gisIndexes"
    ],
    mixins: [drawingMixin, menuMixin],
    data() {
      return {
        width: null,
        canvas: null,
        context: null,
        svg: null,
        focus: null,
        
        xScale: [],
        new_xScale: [],
        
        yAxis: null,
        
        gridsX_scale: [],
        gridsX_axis: [],
        
        zoomX: [],
      };
    },
    computed: {
      ...mapState({
        zoomEvent: state => state.viz.zoomEvent,
        new_yScale: state => state.viz.new_yScale,
        draggedDelta: state => state.viz.draggedDelta,
        currentDraggedInterval: state => state.viz.currentDraggedInterval,
        imageDivided: state => state.viz.imageDivided
      }),
    },
    watch: {
      zoomEvent() {
        this.zoom();
      },
      draggedDelta() {
        this.kernDataMoving();
      },
      imageDivided() {
        this.kernDataDivided();
      },
      deep: true
    },
    mounted() {
      this.width = document.getElementById(`gis-${this.track_num}`).offsetWidth;
      this.chartInit();
      this.lineInit();
      this.$root.$on("redrawTracks", () => {
        let container = document.getElementById(`gis-${this.track_num}`);
        if (container) {
          this.width = container.offsetWidth;
          container.innerHTML = "";
          this.chartInit();
          this.lineInit();
        }
      });
    },
    methods: {
      moveGis(data, index, track_num) {
        this.$emit("moveGis", data, index, track_num);
      },
      
      moveTrack(data, index, track_num) {
        this.$emit("moveTrack", data, index, track_num);
      },
      
      lineParam(data, index, track_num) {
        this.$emit("lineParamEdit", data, index, track_num);
      },
      
      disableLine(data, index, track_num) {
        this.$emit("disableLine", data, index, track_num);
      },
      
      chartInit() {
        this.canvas = d3
          .select(`#gis-${this.track_num}`)
          .append("canvas")
          .attr("width", this.width)
          .attr("height", this.height - this.legendHeight)
          .style("position", "absolute")
          .style("top", this.legendHeight + "px")
          .style("left", "0px")
          .attr("class", "canvas-plot");
        
        this.context = this.canvas.node().getContext("2d");
        
        this.svg = d3
          .select(`#gis-${this.track_num}`)
          .append("svg:svg")
          .attr("width", this.width)
          .attr("height", this.height)
          .attr("class", "svg-plot")
          .style("position", "absolute")
          .style("top", "0px")
          .style("left", "0px")
          .append("g");
        
        this.yAxis = d3
          .axisRight(this.new_yScale)
          .ticks(6)
          .tickSize(this.width)
          .tickPadding(8 - this.width);
        
        this.y_axis = this.svg
          .append("g")
          .attr("transform", "translate(0," + this.legendHeight + ")")
          .call(this.yAxis)
          .style("stroke-dasharray", "5 5")
          .style("opacity", "0.5");
        
        this.focus = this.svg
          .append("g")
          .attr("transform", "translate(0," + this.legendHeight + ")")
          .style("display", "none");
        
        this.focus
          .append("line")
          .attr("class", "y")
          .style("stroke", "blue")
          .style("stroke-dasharray", "3,3")
          .style("opacity", 0.5)
          .attr("x1", this.width)
          .attr("x2", this.width);
        
        this.svg
          .append("rect")
          .attr("width", this.width)
          .attr("height", this.height - this.legendHeight)
          .attr("transform", "translate(0," + this.legendHeight + ")")
          .style("fill", "none")
          .style("pointer-events", "all")
          .on("mouseover", () => {
            this.focus.style("display", null);
          })
          .on("mouseout", () => {
            this.focus.style("display", "none");
          })
          .on("mousemove", this.mousemove);
      },
      
      lineInit() {
        for (let gis in this.line_data) {
          let text = this.svg
            .append("text")
            .attr(
              "transform",
              "translate(" +
              this.width / 2 +
              " ," +
              ((Number(gis) * this.legendHeight) / this.line_data.length +
                this.legendHeight / this.line_data.length / 2 +
                8) +
              ")"
            )
            .style("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "600")
            .attr("fill", this.line_data[gis].color)
            .text(this.line_data[gis].name);
          
          if (this.line_data[gis].log) {
            this.xScale[gis] = d3
              .scaleSymlog()
              .domain([
                d3.min(this.line_data[gis].line, d => +d.value),
                d3.max(this.line_data[gis].line, d => +d.value)
              ])
              .range([0, this.width]);
          } else {
            if (typeof this.line_data[gis].line[0][0] === "object") {
              this.xScale[gis] = d3
                .scaleLinear()
                .domain([
                  d3.min(
                    this.line_data[gis].line.map(int =>
                      d3.min(int, d => +d.value)
                    )
                  ),
                  d3.max(
                    this.line_data[gis].line.map(int =>
                      d3.max(int, d => +d.value)
                    )
                  )
                ])
                .range([0, this.width]);
            } else {
              this.xScale[gis] = d3
                .scaleLinear()
                .domain([
                  d3.min(this.line_data[gis].line, d => +d.value),
                  d3.max(this.line_data[gis].line, d => +d.value)
                ])
                .range([0, this.width]);
            }
          }
          
          this.new_xScale[gis] = this.xScale[gis];
          
          //full grid only first
          if (gis === Object.keys(this.line_data)[0]) {
            this.gridsX_scale[gis] = d3
              .axisBottom(this.xScale[gis])
              .ticks(3)
              .tickSize(this.height)
              .tickPadding(8 - this.height);
          } else {
            this.gridsX_scale[gis] = d3
              .axisBottom(this.xScale[gis])
              .ticks(3)
              .tickSize(this.legendHeight / this.line_data.length)
              .tickPadding(8 - this.legendHeight / this.line_data.length);
          }
          
          this.gridsX_axis[gis] = this.svg
            .append("g")
            .attr(
              "transform",
              "translate(0," +
              (this.legendHeight / this.line_data.length) * Number(gis) +
              ")"
            )
            .call(this.gridsX_scale[gis])
            .style("stroke-dasharray", "5 5")
            .style("opacity", "0.5");
          
          //check lines which consist with intervals
          if (typeof this.line_data[gis].line[0][0] === "object") {
            for (let interval in this.line_data[gis].line) {
              this.redrawLine(
                this.context,
                this.xScale[gis],
                this.new_yScale,
                this.line_data[gis].line[interval],
                this.line_data[gis].color,
                this.line_data[gis].lineWidth,
                this.line_data[gis].style.value
              );
            }
          } else {
            this.redrawLine(
              this.context,
              this.xScale[gis],
              this.new_yScale,
              this.line_data[gis].line,
              this.line_data[gis].color,
              this.line_data[gis].lineWidth,
              this.line_data[gis].style.value
            );
          }
          
          this.zoomX[gis] = () => {
            this.new_xScale[gis] = d3.event.transform.rescaleX(this.xScale[gis]);
            this.gridsX_axis[gis].call(
              this.gridsX_scale[gis].scale(this.new_xScale[gis])
            );
            
            this.context.clearRect(0, 0, this.width, this.height);
            for (let gis in this.line_data) {
              if (typeof this.line_data[gis].line[0][0] === "object") {
                for (let interval in this.line_data[gis].line) {
                  this.redrawLine(
                    this.context,
                    this.new_xScale[gis],
                    this.new_yScale,
                    this.line_data[gis].line[interval],
                    this.line_data[gis].color,
                    this.line_data[gis].lineWidth,
                    this.line_data[gis].style.value
                  );
                }
              } else {
                this.redrawLine(
                  this.context,
                  this.new_xScale[gis],
                  this.new_yScale,
                  this.line_data[gis].line,
                  this.line_data[gis].color,
                  this.line_data[gis].lineWidth,
                  this.line_data[gis].style.value
                );
              }
            }
          };
          
          let top = this.svg
            .append("rect")
            .attr(
              "transform",
              "translate(0," +
              (this.legendHeight / this.line_data.length) * Number(gis) +
              ")"
            )
            .attr("width", this.width)
            .attr("height", this.legendHeight / this.line_data.length)
            .style("fill", this.line_data[gis].color)
            .style("fill-opacity", ".2")
            .style("cursor", "col-resize")
            .style("stroke", "#000")
            .style("stroke-width", "1px")
            .on("mouseover", () => {
              for (let i in this.gridsX_scale) {
                if (i === gis) {
                  this.gridsX_scale[i]
                    .tickSize(this.height)
                    .tickPadding(8 - this.height);
                  this.gridsX_axis[i].call(this.gridsX_scale[i]);
                } else {
                  this.gridsX_scale[i]
                    .tickSize(this.legendHeight / this.line_data.length)
                    .tickPadding(8 - this.legendHeight / this.line_data.length);
                  this.gridsX_axis[i].call(this.gridsX_scale[i]);
                }
              }
              
              top.style("stroke-width", "2.5px").style("fill-opacity", ".15");
              text.style("font-size", "18px");
            })
            .on("mouseleave", () => {
              top.style("stroke-width", "1px").style("fill-opacity", ".2");
              text.style("font-size", "16px");
            })
            .on("contextmenu", () => {
              this.contextMenu(this.menu, this.line_data[gis]);
            })
            .call(
              d3
                .zoom()
                .scaleExtent([-20, 20]) //min max zoom
                .translateExtent([
                  [-1000, -100],
                  [this.width + 1000, this.height + 100]
                ])
                .on("zoom", this.zoomX[gis])
            );
          
          if (typeof this.line_data[gis].line[0][0] !== "object") {
            this.focus
              .append("circle")
              .attr("class", "gis-" + gis)
              .style("fill", "none")
              .style("stroke", "blue")
              .attr("r", 4);
          } else {
            this.focus
              .append("circle")
              .attr("class", "kern-" + gis)
              .style("fill", "none")
              .style("stroke", "blue")
              .attr("r", 4);
          }
        }
      },
      
      kernDataMoving() {
        this.context.clearRect(0, 0, this.width, this.height);
        
        for (let gis in this.line_data) {
          if (this.line_data[gis].type === "kern_data") {
            this.line_data[gis].line[this.currentDraggedInterval].map(point => {
              point.depth += this.draggedDelta;
            });
            
            for (let interval in this.line_data[gis].line) {
              this.redrawLine(
                this.context,
                this.new_xScale[gis],
                this.new_yScale,
                this.line_data[gis].line[interval],
                this.line_data[gis].color,
                this.line_data[gis].lineWidth,
                this.line_data[gis].style.value
              );
            }
          } else {
            this.redrawLine(
              this.context,
              this.new_xScale[gis],
              this.new_yScale,
              this.line_data[gis].line,
              this.line_data[gis].color,
              this.line_data[gis].lineWidth,
              this.line_data[gis].style.value
            );
          }
        }
      },
      
      kernDataDivided() {
        for (let gis in this.line_data) {
          if (this.line_data[gis].type === "kern_data") {
            let kern_data = this.line_data[gis];
            
            //divide moved intervals
            let newKernDataInterval1 = [];
            let newKernDataInterval2 = [];
            let last_index = 0;
            let last_depth = 0;
            
            kern_data.line[this.imageDivided.interval - 1].map((point, index) => {
              if (point.depth < this.imageDivided.currentStart) {
                newKernDataInterval1.push(point);
                last_index = index;
                last_depth = point.depth;
              } else {
                point.interval += 1;
                newKernDataInterval2.push(point);
              }
            });
            kern_data.line.splice(
              this.imageDivided.interval - 1,
              1,
              newKernDataInterval1,
              newKernDataInterval2
            );
          }
        }
      },
      
      mousemove() {
        let i = [],
          d0 = [],
          d1 = [],
          d = [],
          i_kern = [],
          d0_kern = [],
          d1_kern = [],
          d_kern = [],
          y0 = null;
        
        y0 = this.new_yScale.invert(
          d3.event.pageY - this.legendHeight
        );
        
        for (let gis in this.line_data) {
          i_kern.push([]);
          d0_kern.push([]);
          d1_kern.push([]);
          d_kern.push([]);
          if (typeof this.line_data[gis].line[0][0] !== "object") {
            i[gis] = this.bisectData(this.line_data[gis].line, y0);
            d0[gis] = this.line_data[gis].line[i[gis] - 1];
            d1[gis] = this.line_data[gis].line[i[gis]];
            d[gis] = y0 - d0[gis].depth > d1[gis].depth - y0 ? d1[gis] : d0[gis];
            
            this.focus
              .select("circle.gis-" + gis)
              .attr(
                "transform",
                "translate(" +
                this.new_xScale[gis](d[gis].value) +
                "," +
                this.new_yScale(d[gis].depth) +
                ")"
              );
            
            this.focus
              .select(".y")
              .attr(
                "transform",
                "translate(" +
                this.width * -1 +
                "," +
                this.new_yScale(d[Object.keys(this.line_data)[0]].depth) +
                ")"
              )
              .attr("x1", 0)
              .attr("x2", this.width + this.width);
          } else {
            for (let kernData in this.line_data[gis].line) {
              try {
                i_kern[gis][kernData] = this.bisectData(
                  this.line_data[gis].line[kernData],
                  y0
                );
                d0_kern[gis][kernData] = this.line_data[gis].line[kernData][
                i_kern[gis][kernData] - 1
                  ];
                d1_kern[gis][kernData] = this.line_data[gis].line[kernData][
                  i_kern[gis][kernData]
                  ];
                d_kern[gis][kernData] =
                  y0 - d0_kern[gis][kernData].depth >
                  d1_kern[gis][kernData].depth - y0
                    ? d1_kern[gis][kernData]
                    : d0_kern[kernData];
                
                this.focus
                  .select("circle.kern-" + gis)
                  .attr(
                    "transform",
                    "translate(" +
                    this.new_xScale[gis](d_kern[gis][kernData].value) +
                    "," +
                    this.new_yScale(d_kern[gis][kernData].depth) +
                    ")"
                  );
              } catch (e) {
              }
            }
          }
        }
      },
      
      zoom() {
        if (
          this.zoomEvent.sourceEvent &&
          this.zoomEvent.sourceEvent.type !== "zoom"
        ) {
          this.y_axis.call(this.yAxis.scale(this.new_yScale));
          
          this.context.clearRect(0, 0, this.width, this.height);
          
          for (let gis in this.line_data) {
            if (typeof this.line_data[gis].line[0][0] === "object") {
              for (let interval in this.line_data[gis].line) {
                this.redrawLine(
                  this.context,
                  this.new_xScale[gis],
                  this.new_yScale,
                  this.line_data[gis].line[interval],
                  this.line_data[gis].color,
                  this.line_data[gis].lineWidth,
                  this.line_data[gis].style.value
                );
              }
            } else {
              this.redrawLine(
                this.context,
                this.new_xScale[gis],
                this.new_yScale,
                this.line_data[gis].line,
                this.line_data[gis].color,
                this.line_data[gis].lineWidth,
                this.line_data[gis].style.value
              );
            }
          }
        }
      },
      
      redrawLine(context, x_scale, y_scale, data, color, line_width, type) {
        context.save();
        context.beginPath();
        
        if (type === "dot") {
          data.map(point => this.$_drawPoint(point, context, x_scale, y_scale, color, line_width));
        } else if (type === "line") {
          let line = d3
            .line()
            .x(d => {
              return x_scale(d.value);
            })
            .y(d => {
              return y_scale(d.depth);
            })
            .context(context);
          
          line(data);
          
          context.lineWidth = line_width;
          context.strokeStyle = color;
          context.stroke();
        }
        
        context.restore();
      },
      
      bisectData(data, value) {
        let bisectData = d3.bisector(function (d) {
          return d.depth;
        }).left;
        return bisectData(data, value, 1);
      },
    }
  };
</script>

<style lang="scss" scoped>
  .gis_block {
    flex-basis: 100%;
    position: relative;
    max-width: 500px;
    
    &:hover {
      border-radius: 4px;
      box-shadow: rgba(0, 0, 0, 0.2) 0px 3px 5px -1px,
      rgba(0, 0, 0, 0.14) 0px 5px 8px 0px, rgba(0, 0, 0, 0.12) 0px 1px 14px 0px;
      box-sizing: border-box;
    }
  }
  
  .dot {
    fill: steelblue;
    stroke: steelblue;
    stroke-width: 1.5px;
  }
</style>

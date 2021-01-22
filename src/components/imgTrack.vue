<template>
  <div id="img-track"></div>
</template>

<script>
  import * as d3 from "d3";
  import {mapState} from "vuex";
  import drawingMixin from "@/mixins/drawingMixin.js"
  
  export default {
    name: "imgTrack",
    props: [
      "img_data",
      "depth_data",
      "height",
      "legendHeight",
      "imagesIntervals",
      "wellLineData"
    ],
    mixins: [drawingMixin],
    data() {
      return {
        width: null,
        svg: null,
        fullViewSvg: null,
        
        xScale: null,
        new_xScale: null,
        xAxis: null,
        
        yAxis: null,
        yScale2: null,
        yAxis2: null,
        brush: null,
        
        imgTopBorder: null,
        imgTopBorderDepth: null,
        
        wellLine: null,
        
        wellViewWidth: 85,
        
        menu: [
          {
            title: "Разбить интервал",
            action: (elm, d, i) => {
              this.divideInterval(d);
            }
          }
        ]
      };
    },
    computed: {
      ...mapState({
        zoomEvent: state => state.viz.zoomEvent,
        yScale: state => state.viz.yScale,
        new_yScale: state => state.viz.new_yScale
      })
    },
    watch: {
      zoomEvent() {
        this.zoom();
      },
      deep: true
    },
    mounted() {
      this.width = document.getElementById("img-track").offsetWidth;
      this.chartInit();
      this.lineInit();
      
      this.$root.$on("redrawTracks", () => {
        let container = document.getElementById("img-track")
        this.width = container.offsetWidth;
        container.innerHTML = "";
        this.chartInit();
        this.lineInit();
      });
    },
    methods: {
      chartInit() {
        this.svg = d3
          .select("#img-track")
          .append("svg:svg")
          .attr("width", this.width - this.wellViewWidth)
          .attr("height", this.height - this.legendHeight)
          .attr("transform", "translate(0,0)")
          .attr("class", "svg-plot")
          .style("position", "absolute")
          .style("top", this.legendHeight + "px")
          .style("left", this.wellViewWidth + "px")
        
        this.fullViewSvg = d3
          .select("#img-track")
          .append("svg:svg")
          .attr("width", this.wellViewWidth)
          .attr("height", this.height - this.legendHeight)
          .attr("transform", "translate(0,0)")
          .attr("class", "svg-plot")
          .style("position", "absolute")
          .style("top", this.legendHeight + "px")
          .style("left", "0px")
      },
      
      brushed() {
        if (d3.event.sourceEvent && d3.event.type && d3.event.type !== "end") {
          var s = d3.event.selection || this.yScale2.range();
          this.$store.commit(
            "SET_NEW_Y_SCALE",
            this.new_yScale.domain(s.map(this.yScale2.invert, this.yScale2))
          );
          this.$store.commit("SET_ZOOM_EVENT", d3.event);
        }
      },
      
      lineInit() {
        this.xScale = d3
          .scaleLinear()
          .domain([
            d3.min(this.wellLineData.line, d => +d.value),
            d3.max(this.wellLineData.line, d => +d.value)
          ])
          .range([0, this.wellViewWidth]);
        this.xAxis = d3.axisBottom(this.xScale);
        
        this.yScale2 = d3
          .scaleLinear()
          .domain(this.depth_data)
          .range([0, this.height - this.legendHeight]);
        
        this.yAxis = d3
          .axisRight(this.yScale)
          .ticks(6)
          .tickSize(this.width)
          .tickPadding(8 - this.width);
        
        this.yAxis2 = d3
          .axisRight(this.yScale2)
          .ticks(6)
          .tickSize(this.wellViewWidth)
          .tickPadding(8 - this.wellViewWidth);
        
        this.fullViewSvg
          .append("g")
          .attr("class", "axis axis--x")
          .attr("transform", "translate(0," + this.height + ")")
          .call(this.xAxis);
        
        this.fullViewSvg
          .append("g")
          .attr("class", "axis axis--y")
          .call(this.yAxis2);
        
        this.wellLine = d3
          .line()
          .x(d => this.xScale(d.value))
          .y(d => this.yScale2(d.depth));
        
        this.fullViewSvg
          .append("path")
          .datum(this.wellLineData.line)
          .attr("class", "line")
          .attr("d", this.wellLine)
          .attr("stroke", this.wellLineData.color)
          .attr("fill", this.wellLineData.color);
        
        this.imagesIntervals.map(interval =>
          this.$_drawMaterial(interval, "rgba(31, 121, 214, .4)", this.fullViewSvg)
        );
        
        this.y_axis = this.svg
          .append("g")
          .attr("id", "img_grid")
          .attr("class", "axis img_grid grid--axis--y")
          .style("stroke-dasharray", "5 0")
          .call(this.yAxis);
        
        this.brush = d3
          .brushY()
          .extent([
            [0, 0],
            [this.wellViewWidth, this.height]
          ])
          .on("brush end", this.brushed);
        
        this.fullViewSvg
          .append("g")
          .attr("class", "brush")
          .call(this.brush)
          .call(this.brush.move, this.yScale2.range());
        
        d3.select(`#core-visualization`).call(
          d3
            .zoom()
            .scaleExtent([1, 1000]) //min max zoom
            .translateExtent([
              [0, -100],
              [this.width, this.height + 100]
            ])
            .on("zoom", this.zoomHandler)
        );
        
        this.svg.selectAll("use").remove();
        
        let bg_img = {
          start: this.depth_data[0],
          end: this.depth_data[1],
          currentStart: this.depth_data[0],
          currentEnd: this.depth_data[1]
        };
        
        // set grey bg
        this.svg
          .append("svg:rect")
          .attr("fill", "rgba(204,204,204,0.6)")
          .attr("y", this.yScale(bg_img.start))
          .attr("x", 5)
          .attr("height", this.yScale(bg_img.end) - this.yScale(bg_img.start))
          .attr("width", 60)
          .attr("preserveAspectRatio", "none")
          .attr("id", "bg_img_DL");
        
        this.svg
          .append("svg:rect")
          .attr("fill", "rgba(204,204,204,0.6)")
          .attr("y", this.yScale(bg_img.start))
          .attr("x", 70)
          .attr("height", this.yScale(bg_img.end) - this.yScale(bg_img.start))
          .attr("width", 60)
          .attr("preserveAspectRatio", "none")
          .attr("id", "bg_img_data");
        
        this.images = this.svg
          .selectAll("images")
          .data(this.img_data)
          .enter()
          .append("svg:image")
          .attr("xlink:href", d => `/images/${d.image}`)
          .attr("y", d => this.yScale(d.start))
          .attr("x", d => {
            if (d.type === "DL") return 5;
            if (d.type === "UV") return 70;
          })
          .attr("height", d => this.yScale(d.end) - this.yScale(d.start))
          .attr("width", 60)
          .attr("preserveAspectRatio", "none")
          .attr("id", d => d.id)
          .style("cursor", "grab");
        
        this.images
          .on("contextmenu", d => {
            this.contextMenu(this.menu, d);
          })
          .call(
            d3
              .drag()
              .on("start", dragstarted)
              .on("drag", dragged)
              .on("end", dragended)
          );
        
        let self = this;
        
        let delta = 0,
          interval_start,
          interval_end,
          previous_interval_end,
          next_interval_start,
          interval_index = 0,
          startY = 0,
          endY = 0;
        
        function dragstarted(d) {
          startY = self.new_yScale.invert(d3.event.y);
          interval_index = d.interval;
          //get params of current interval
          interval_start = self.imagesIntervals[interval_index][0];
          interval_end = self.imagesIntervals[interval_index][1];
          //get end of previous interval if exist
          if (self.imagesIntervals[interval_index - 1]) {
            previous_interval_end = self.imagesIntervals[interval_index - 1][1];
          } else {
            previous_interval_end = self.depth_data[0];
          }
          //get start of next interval if exist
          if (self.imagesIntervals[interval_index + 1]) {
            next_interval_start = self.imagesIntervals[interval_index + 1][0];
          } else {
            next_interval_start = self.depth_data[self.depth_data.length - 1];
          }
          
          self.$store.commit("SET_CURRENT_DRAGGED_INTERVAL", interval_index);
        }
        
        function dragged(d) {
          d3.select(this).style("cursor", "grabbing");
          delta = delta + d3.event.dy;
          let prev_length_uv = 0;
          let prev_length_dl = 0;
          
          //select all interval
          let interval = self.images.filter(i => i.interval === interval_index);
          
          interval.attr("y", (data, index) => {
            let length_of_next_imgs_uv = 0;
            let length_of_next_imgs_dl = 0;
            
            if (data.type === "UV") {
              //computing length of imgs after current
              for (let i = index; i < interval.data().length; i++) {
                if (interval.data()[i].type === "UV") {
                  length_of_next_imgs_uv =
                    length_of_next_imgs_uv +
                    interval.data()[i].currentEnd -
                    interval.data()[i].currentStart;
                }
              }
              //computing new y coord
              let y = Math.min(
                Math.max(
                  self.new_yScale(data.currentStart) + delta,
                  self.new_yScale(previous_interval_end) + prev_length_uv
                ),
                self.new_yScale(next_interval_start - length_of_next_imgs_uv)
              );
              //computing length of imgs before current
              prev_length_uv =
                prev_length_uv +
                self.new_yScale(data.currentEnd) -
                self.new_yScale(data.currentStart);
              return y;
            } else {
              //computing length of imgs after current
              for (let i = index; i < interval.data().length; i++) {
                if (interval.data()[i].type === "DL") {
                  length_of_next_imgs_dl =
                    length_of_next_imgs_dl +
                    interval.data()[i].currentEnd -
                    interval.data()[i].currentStart;
                }
              }
              //computing new y coord
              let y = Math.min(
                Math.max(
                  self.new_yScale(data.currentStart) + delta,
                  self.new_yScale(previous_interval_end) + prev_length_dl
                ),
                self.new_yScale(next_interval_start - length_of_next_imgs_dl)
              );
              //computing length of imgs before current
              prev_length_dl =
                prev_length_dl +
                self.new_yScale(data.currentEnd) -
                self.new_yScale(data.currentStart);
              return y;
            }
          });
        }
        
        function dragended(d) {
          delta = 0;
          d3.select(this).style("cursor", "grab");
          endY = self.new_yScale.invert(d3.event.y);
          let point_delta = endY - startY;
          
          //Handling contacts with other intervals
          if (endY <= previous_interval_end) {
            point_delta = previous_interval_end - interval_start;
          } else if (
            interval_end === next_interval_start &&
            endY > next_interval_start
          ) {
            point_delta = 0;
          } else if (
            interval_start === previous_interval_end &&
            endY < previous_interval_end
          ) {
            point_delta = 0;
          } else if (endY >= next_interval_start) {
            point_delta = next_interval_start - interval_end;
          } else if (
            endY > previous_interval_end &&
            endY <= previous_interval_end + (startY - interval_start)
          ) {
            point_delta = previous_interval_end - interval_start;
          } else if (
            endY < next_interval_start &&
            endY >= next_interval_start - (interval_end - startY)
          ) {
            point_delta = next_interval_start - interval_end;
          }
          
          self.$store.commit("SET_DRAGGED_DELTA", point_delta);
          //arrays of images starts and ends coords
          let int_start = [];
          let int_end = [];
          
          //recomputing currentStart = y coord and currentEnd = y - height
          self.images
            .filter(i => i.interval === interval_index)
            .attr("y", function (data) {
              data.currentStart = self.new_yScale.invert(
                d3.select(this).attr("y")
              );
              data.currentEnd = self.new_yScale.invert(
                Number(d3.select(this).attr("y")) +
                Number(d3.select(this).attr("height"))
              );
              int_start.push(data.currentStart);
              int_end.push(data.currentEnd);
              return self.new_yScale(data.currentStart);
            });
          
          //rewrite current intervals start/end markers
          self.imagesIntervals[interval_index] = [
            int_start[0],
            int_end[int_end.length - 1]
          ];
        }
        
        //grid up to imgs
        this.svg.append("use").attr("xlink:href", "#img_grid");
        this.svg.append("use").attr("xlink:href", "#bg1");
      },
      
      divideInterval(selectedImg) {
        if (
          selectedImg.currentStart !==
          this.imagesIntervals[selectedImg.interval][0]
        ) {
          let elem1 = [
            this.imagesIntervals[selectedImg.interval][0],
            selectedImg.currentStart
          ];
          let elem2 = [
            selectedImg.currentStart,
            this.imagesIntervals[selectedImg.interval][1]
          ];
          
          this.imagesIntervals.splice(selectedImg.interval, 1, elem1, elem2);
          
          this.$store.commit("SET_IMAGE_DIVIDED", selectedImg);
          
          this.images
            .filter(i => i.currentStart >= selectedImg.currentStart)
            .data()
            .map(img => (img.interval = img.interval + 1));
        } else {
          alert("Изображение первое в интервале! Выберите другое изображение");
        }
      },
      
      zoomHandler() {
        this.$store.commit(
          "SET_NEW_Y_SCALE",
          d3.event.transform.rescaleY(this.yScale)
        );
        this.$store.commit("SET_ZOOM_EVENT", d3.event);
      },
      
      zoom() {
        this.y_axis.call(this.yAxis.scale(this.new_yScale));
        
        this.images
          .attr("y", d => this.new_yScale(d.currentStart))
          .attr("height", d => {
            return (
              this.new_yScale(d.currentEnd) - this.new_yScale(d.currentStart)
            );
          });
        
        try {
          this.imgTopBorder.attr(
            "transform",
            "translate(0," + this.new_yScale(this.imgTopBorderDepth) + ")"
          );
        } catch (e) {
        }
        
        if (this.zoomEvent.type !== "brush") {
          this.fullViewSvg
            .select(".brush")
            .call(
              this.brush.move,
              this.yScale2
                .range()
                .map(this.zoomEvent.transform.invertY, this.zoomEvent.transform)
            );
        }
      },
      
      contextMenu(menu, data) {
        try {
          this.imgTopBorder.remove();
        } catch (e) {
        }
        
        //add border
        this.imgTopBorder = this.svg
          .append("line")
          .attr("id", "imgTopBorder")
          .style("stroke", "red")
          .style("stroke-width", 3)
          .style("stroke-dasharray", "1,0")
          .style("opacity", 1)
          .attr("class", "intervals")
          .attr(
            "transform",
            "translate(0," + this.new_yScale(data.currentStart) + ")"
          )
          .attr("x1", 0)
          .attr("x2", 150);
        
        this.imgTopBorderDepth = data.currentStart;
        
        // create the div element that will hold the context menu
        d3.selectAll(".d3-context-menu")
          .data([1])
          .enter()
          .append("div")
          .attr("class", "d3-context-menu");
        
        // close menu
        d3.select("body").on("click.d3-context-menu", () => {
          d3.select(".d3-context-menu").style("display", "none");
          this.imgTopBorder.remove();
        });
        
        // this gets executed when a contextmenu event occurs
        var elm = this;
        
        d3.selectAll(".d3-context-menu").html("");
        var list = d3.selectAll(".d3-context-menu").append("ul");
        list
          .selectAll("li")
          .data(menu)
          .enter()
          .append("li")
          .html(function (d) {
            return d.title;
          })
          .on("click", (d, i) => {
            d.action(elm, data, i);
            d3.select(".d3-context-menu").style("display", "none");
            this.imgTopBorder.remove();
          });
        
        // display context menu
        d3.select(".d3-context-menu")
          .style("left", d3.event.pageX - 2 + "px")
          .style("top", d3.event.pageY - 2 + "px")
          .style("display", "block");
        
        d3.event.preventDefault();
      }
    }
  };
</script>

<style lang="scss" scoped>
  .grid--axis--y,
  .grid--axis--x {
    line {
      opacity: 0.5;
    }
  }
</style>

<style lang="scss">
  .d3-context-menu {
    position: absolute;
    display: none;
    background-color: #f2f2f2;
    border-radius: 4px;
    
    font-family: Arial, sans-serif;
    font-size: 14px;
    min-width: 150px;
    border: 1px solid #d4d4d4;
    
    z-index: 1200;
    
    &__child {
      position: absolute;
      right: 0;
      transform: translate(100%, 0);
      background-color: #f2f2f2;
      border-radius: 4px;
      border: 1px solid #d4d4d4;
      color: black;
      
      ul li:hover {
        background-color: #0074bb;
        color: #fefefe;
      }
    }
  }
  
  .d3-context-menu ul {
    list-style-type: none;
    margin: 4px 0px;
    padding: 0px;
    cursor: default;
  }
  
  .d3-context-menu ul li {
    padding: 4px 16px;
  }
  
  .d3-context-menu ul li:hover {
    background-color: #0074bb;
    color: #fefefe;
  }
</style>

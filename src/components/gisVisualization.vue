<template>
  <div class="core-visualization" id="core-visualization">
    <img-track
      class="core-visualization__img-track"
      v-if="isData"
      :wellLineData="VizData.line_data[0][0]"
      :height="height"
      :width="300"
      :legendHeight="legendHeight"
      :imagesIntervals="VizData.imagesIntervals"
      :img_data="VizData.img_data"
      :depth_data="VizData.depth_data"
    ></img-track>
    <gis-track
      v-if="isData"
      v-for="(data, index) in gisTracks"
      :key="index"
      :track_num="index"
      :line_data="data"
      :height="height"
      :legendHeight="legendHeight"
      :gisIndexes="gisIndexes"
      :isStructuralBreaks="null"
      @moveGis="moveGis"
      @moveTrack="moveTrack"
      @lineParamEdit="lineParamEdit"
      @disableLine="disableLine"
    ></gis-track>
    
    <edit-line-dialog
      :editLineDialog="editLineDialog"
      :editLineData="editLineData"
      @editLineParamsCancel="editLineParamsCancel"
      @editLineParamsSubmitted="editLineParamsSubmitted"
    />
  </div>
</template>

<script>
  import * as d3 from "d3";
  
  import gisTrack from "./gisTrack";
  import imgTrack from "./imgTrack";
  import EditLineDialog from "./dialogs/editLineDialog";
  
  export default {
    name: "gisVisualization",
    props: ["resultJson", "wellName", "loggingResearchList"],
    components: {
      EditLineDialog,
      imgTrack,
      gisTrack
    },
    data() {
      return {
        VizData: {
          imagesIntervals: [],
          depth_data: [],
          line_data: [],
          img_data: []
        },
        
        editLineDialog: false,
        editLineDataIndex: null,
        editLineData: {
          name: null,
          lineWidth: null,
          color: null,
          style: {
            text: "",
            value: null
          },
          log: null
        },
        
        yScale: null,
        isData: false,
        
        height: null,
        legendHeight: 90,
        
        originalLineData: null
      };
    },
    computed: {
      gisTracks() {
        return this.VizData.line_data.filter(line => line.length > 0);
      },
      gisIndexes() {
        return Array.apply(null, {length: this.gisTracks.length}).map(
          Number.call,
          Number
        );
      }
    },
    mounted() {
      this.height = window.innerHeight
      window.onresize = () => {
        this.height = window.innerHeight
        this.redrawVisualization()
      }
      
      this.parseJson();
    },
    beforeDestroy() {
      window.onresize = null
    },
    methods: {
      parseJson() {
        this.VizData = this.resultJson
        this.originalLineData = Object.assign([], this.VizData.line_data)
        
        this.yScale = d3
          .scaleLinear()
          .domain(this.VizData.depth_data)
          .range([0, this.height - this.legendHeight]);
        
        this.$store.commit("SET_Y_SCALE", this.yScale);
        this.$store.commit("SET_NEW_Y_SCALE", this.yScale);
        this.isData = true;
      },
      
      redrawVisualization() {
        this.VizData.line_data.map((track, index) => {
          if (track.length === 0) {
            this.VizData.line_data.splice(index, 1);
          }
        });
        
        this.$nextTick(() => {
          this.$root.$emit("redrawTracks");
        });
      },
      
      moveGis(data, target) {
        let trackNum = -1;
        this.VizData.line_data.map((track, index) => {
          if (track.indexOf(data) > -1) {
            track.splice(track.indexOf(data), 1);
            trackNum = index;
          }
        });
        
        if (target >= 0) {
          this.VizData.line_data[target].push(data);
        } else {
          this.VizData.line_data.push([data]);
        }
        
        this.redrawVisualization();
      },
      
      moveTrack(data, target, track_num) {
        let track = this.VizData.line_data[track_num].slice();
        let trackNum = -1;
        this.VizData.line_data.map((track, index) => {
          if (track.indexOf(data) > -1) {
            trackNum = index;
          }
        });
        
        this.VizData.line_data.splice(trackNum, 1);
        this.VizData.line_data.splice(target, 0, track);
        
        this.redrawVisualization();
      },
      
      disableLine(data) {
        this.VizData.line_data.map(track => {
          if (track.indexOf(data) > -1) {
            track.splice(track.indexOf(data), 1);
          }
        });
        this.redrawVisualization();
      },
      
      lineParamEdit(data, index, track_num) {
        this.editLineData = data;
        this.editLineDataIndex = [
          track_num,
          this.VizData.line_data[track_num].indexOf(data)
        ];
        this.editLineDialog = true;
      },
      
      editLineParamsSubmitted() {
        const track = this.editLineDataIndex[0];
        const gisInTrack = this.editLineDataIndex[1];
        this.VizData.line_data[track][gisInTrack] = {
          ...this.editLineData
        }
        this.redrawVisualization();
        this.editLineDialog = false;
      },
      
      editLineParamsCancel() {
        this.editLineDialog = false;
        this.editLineData = {
          name: null,
          lineWidth: null,
          color: null,
          style: {
            text: "",
            value: null
          }
        };
      }
    },
  };
</script>

<style lang="scss">
  .core-visualization {
    display: flex;
    justify-content: start;
    height: 100%;
    
    &__templates-container {
      position: absolute;
      width: 220px;
      z-index: 5;
      padding-right: 5px;
    }
    
    &__img-track {
      position: relative;
      min-width: 220px;
      max-width: 220px;
      height: 100%;
    }
  }
  
  .background {
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 1001;
    cursor: row-resize;
  }
  
  .legend-resize {
    position: absolute;
    opacity: 0;
    background: blue;
    left: 0;
    top: 90px;
    right: 0;
    height: 2px;
    z-index: 1000;
    
    &:hover {
      opacity: 1;
      cursor: row-resize;
    }
  }

</style>

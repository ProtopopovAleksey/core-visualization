export default {
  state: {
    zoomEvent: null,
    yScale: null,
    new_yScale: null,
    
    currentDraggedInterval: null,
    draggedDelta: null,
    
    imageDivided: null,
  },
  
  mutations: {
    SET_ZOOM_EVENT(state, payload) {
      state.zoomEvent = payload
    },
    SET_Y_SCALE(state, payload) {
      state.yScale = payload
    },
    SET_NEW_Y_SCALE(state, payload) {
      state.new_yScale = payload
    },
    SET_CURRENT_DRAGGED_INTERVAL(state, payload) {
      state.currentDraggedInterval = payload
    },
    SET_DRAGGED_DELTA(state, payload) {
      state.draggedDelta = payload
    },
    SET_IMAGE_DIVIDED(state, payload) {
      state.imageDivided = payload
    },
  },
  actions: {},
  getters: {}
}

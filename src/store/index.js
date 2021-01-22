import Vue from 'vue'
import Vuex from 'vuex'
import viz from './modules/visualization'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {},
  modules: {
    viz,
  },
  mutations: {},
  actions: {},
  getters: {},
})
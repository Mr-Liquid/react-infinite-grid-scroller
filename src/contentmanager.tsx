// contentmanager.tsx

import React, {useContext} from 'react'
import ReactDOM from 'react-dom'

const contentlists = new Map()

export let portalCacheMap = new Map()

export const PortalCache = ({portalCacheMap}) => {
    let portalLists = []
    let portalkeys = []
    portalCacheMap.forEach((value, key) => {
        if (value.modified) {
            value.portalList = Array.from(value.portals.values())
            value.modified = false
        }
        portalLists.push(value.portalList)
        portalkeys.push(key)
    })
    let index = 0
    let portalblocks = []
    for (let key of portalkeys) {
        portalblocks.push(<div key = {key}>{portalLists[index]}</div>)
        index++
    }
    return <div>{portalblocks}</div>
}

const getPortal = (content, container, index) => {
    // console.log('returning from getPortal')
    return ReactDOM.createPortal(content, container, index)
    // return <ItemPortal content = {content} container = {container}/>
} 
class ContentManager {
    // constructor() {}
    setScrollerContentlist (scrollerID) {
        if (!contentlists.has(scrollerID)) {
            contentlists.set(scrollerID, new Map())
        }
        if (!portalCacheMap.has(scrollerID)) {
            portalCacheMap.set(scrollerID, {modified:false,portals:new Map(),portalList:[]})
        }
    }
    clearScrollerContentlist (scrollerID) {
        if (contentlists.has(scrollerID)) {
            contentlists.get(scrollerID).clear()
        }
        if (portalCacheMap.has(scrollerID)) {
            portalCacheMap.delete(scrollerID)
        }
    }
    deleteScrollerContentlist (scrollerID) {
        contentlists.delete(scrollerID)
    }
    setContentlistItem (scrollerID, index, content) {
        if (this.hasContentlistItem(scrollerID, index)) {
            return this.getContentlistItem(scrollerID,index).portal
        }
        let container = document.createElement('div')
        container.style.top = '0px'
        container.style.right = '0px'
        container.style.left = '0px'
        container.style.bottom = '0px'
        container.style.position = 'absolute'
        container.dataset.index = index
        container.dataset.scrollerid = scrollerID
        let portal = getPortal(content, container, index)
        // portalList.push(<div key = {index}>{portal}</div>)
        let portalitem = portalCacheMap.get(scrollerID)
        portalitem.portals.set(index,portal)
        portalitem.modified = true
        contentlists.get(scrollerID).set(index, {content, target:null, container, portal} )
        return portal
    }
    deleteContentlistItem (scrollerID, index) {
        let itemdata = contentlists.get(scrollerID).get(index)
        contentlists.get(scrollerID).delete(index)
        let portalitem = portalCacheMap.get(scrollerID)
        portalitem.portals.delete(index)
        portalitem.modified = true
    }
    attachContentlistItem (scrollerID, index, target) {
        this.detachContentlistItem(scrollerID, index)
        let item = contentlists.get(scrollerID).get(index)
        // console.log('item to be attached; scrollerID, index',item, scrollerID, index)
        if (!item) return
        target.appendChild(item.container)
        item.target = target
    }
    detachContentlistItem (scrollerID, index) {
        let item = contentlists.get(scrollerID).get(index)
        if (item) {
            // console.log('detach child item scrollerID, index',item, scrollerID, index)
            if (item.target && item.container) {
                try {
                    item.target.removeChild(item.container)
                } catch(e) {
                    // noops
                }
            }
        }
    }
    hasContentlistItem (scrollerID, index) {
        return contentlists.get(scrollerID).has(index)
    }
    getContentlistItem (scrollerID, index) {
        return contentlists.get(scrollerID).get(index)
    }
}

const contentManager = new ContentManager()

const CacheContext = React.createContext(null)

export const ContentContext = React.createContext(contentManager)
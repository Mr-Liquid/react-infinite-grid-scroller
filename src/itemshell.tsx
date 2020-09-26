// itemframe.tsx
// copyright (c) 2020 Henrik Bechmann, Toronto, Licence: MIT

import React, {useRef, useEffect, useState, useCallback, useMemo } from 'react'

import ReactDOM from 'react-dom'

import {requestIdleCallback, cancelIdleCallback} from 'requestidlecallback'

import useIsMounted from 'react-is-mounted-hook'

import Placeholder from './placeholder'

const ItemShell = (props) => {
    const {orientation, cellHeight, cellWidth, index, observer, callbacks, getItem, listsize, placeholder, instanceID, portals, scrollerName} = props
    
    const portalRef = useRef(portals.get(index)?portals.get(index).current:
        {placeholder:null, container:null, content:null, portal:null})
    const [content, saveContent] = useState(portalRef.current.content)
    const [error, saveError] = useState(null)
    const [styles,saveStyles] = useState({
        overflow:'hidden',
    } as React.CSSProperties)
    const [itemstate,setItemstate] = useState('setup')
    const shellRef = useRef(null)
    console.log('----index, itemstate, portalRef',index, itemstate, {...portalRef.current})
    const instanceIDRef = useRef(instanceID)
    const isMounted = useIsMounted()
    const itemrequestRef = useRef(null)

    // initialize
    useEffect(() => {
        if (portalRef.current.content) {
            // isMounted() && saveContent(portalRef.current.content)
            return
        }
        let requestidlecallback = window['requestIdleCallback']?window['requestIdleCallback']:requestIdleCallback
        let cancelidlecallback = window['cancelIdleCallback']?window['cancelIdleCallback']:cancelIdleCallback
        if (getItem) {
            console.log('getting item: index, scrollerName',index, scrollerName)
            itemrequestRef.current = requestidlecallback(()=> {

                let value = getItem(index)
                if (value && value.then) {
                    value.then((value) => {
                        if (isMounted()) { 
                            saveContent(value)
                            saveError(null)
                        }
                    }).catch((e) => {
                        if (isMounted()) { 
                            saveContent(null)
                            saveError(e)
                        }
                    })
                } else {
                    if (isMounted()) {
                        if (value) {
                            saveContent(value)
                            saveError(null)
                        } else {
                            saveError(true)
                            saveContent(null)
                        }
                    }
                }
            },{timeout:200})
        }

        return () => {
            let requesthandle = itemrequestRef.current
            cancelidlecallback(requesthandle)
        }
    },[])

    useEffect(()=>{
        if (itemstate == 'setup') {
            setItemstate('ready')
        }

    },[itemstate])

    // initialize
    useEffect(() => {

        let localcalls = callbacks

        localcalls.getElementData && localcalls.getElementData(getElementData(),'register')

        return (()=>{

            localcalls.getElementData && localcalls.getElementData(getElementData(),'unregister')

        })

    },[callbacks])

    useEffect(()=>{

        observer.observe(shellRef.current)

        return () => {

            observer.unobserve(shellRef.current)

        }

    },[observer])

    useEffect(()=>{

        let newStyles = getShellStyles(orientation, cellHeight, cellWidth, styles)
        if (isMounted()) {
            saveStyles(newStyles)
        }

    },[orientation,cellHeight,cellWidth])

    // cradle ondemand callback parameter value
    const getElementData = useCallback(()=>{
        return [index, shellRef, portalRef]
    },[])

    // placeholder handling
    const customholderRef = useRef(
        portalRef.current.placeholder?portalRef.current.placeholder:
            placeholder?React.createElement(placeholder, {index, listsize}):null
    )

    const child = useMemo(()=>{
        if (content) {
            // (!portalRef.current.content) && (portalRef.current.content = content)
            return content
        }
        console.log('updating child:index, content, portalRef.current.content,customholderRef.current',
            index, content, portalRef.current.content,customholderRef.current)
        let child = content?
            content:customholderRef.current?
                customholderRef.current:<Placeholder index = {index} listsize = {listsize} error = {error}/>
        // console.log('index, child memo', index, child)
        (!portalRef.current.placeholder) && (portalRef.current.placeholder = (customholderRef.current?
            customholderRef.current:
            <Placeholder index = {index} listsize = {listsize} error = {error}/>));
        return child
    }, [index, content, customholderRef.current, listsize, error])

    const container = useMemo(()=>{
        let ctr 
        if (portalRef.current.container) {
            ctr = portalRef.current.container
            return ctr 
        }
        ctr = document.createElement('div')
        ctr.style.top = '0px'
        ctr.style.right = '0px'
        ctr.style.left = '0px'
        ctr.style.bottom = '0px'
        ctr.style.position = 'absolute'

        portalRef.current.container = ctr

        return ctr
    },[])

    const localportal = useMemo(() => {
        // console.log('updating local portal')
        if (portalRef.current.content) {
            return portalRef.current.portal
        }

        (!portalRef.current.content) && content && (portalRef.current.content = content)

        if (itemstate != 'ready') return null

        let localportal = ReactDOM.createPortal(child,container)
        portalRef.current.portal = localportal
        console.log('SETTING LOCALPORTAL index, child, container, itemstate, localportal',
            index, child, container, itemstate, localportal)
        return localportal

    },[child, container, itemstate, content])

    useEffect(() => {
        if (itemstate != 'ready') return
        shellRef.current.appendChild(container)
        return () => {
            shellRef.current.removeChild(container)
        }
    },[itemstate, container])

    return <div ref = { shellRef } data-index = {index} data-instanceid = {instanceID} style = {styles}>
        { localportal /*(itemstate == 'ready') && ReactDOM.createPortal(child,container)*/ }
    </div>

} // ItemShell

// TODO: memoize this
const getShellStyles = (orientation, cellHeight, cellWidth, styles) => {

    let styleset = Object.assign({position:'relative'},styles)
    if (orientation == 'horizontal') {
        styleset.width = cellWidth?(cellWidth + 'px'):'auto'
        styleset.height = 'auto'
    } else if (orientation === 'vertical') {
        styleset.width = 'auto'
        styleset.height = cellHeight?(cellHeight + 'px'):'auto'
    }

    return styleset

}

export default ItemShell

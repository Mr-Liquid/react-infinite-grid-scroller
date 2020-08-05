// cradlefunctions.tsx
// copyright (c) 2020 Henrik Bechmann, Toronto, Licence: MIT

/******************************************************************************************
 ------------------------------------[ SUPPORTING FUNCTIONS ]------------------------------
*******************************************************************************************/

import React from 'react'

import ItemShell from './itemshell'

import { detect } from 'detect-browser'

const browser = detect()

export const calcVisibleItems = (
        {itemElementMap, viewportElement, spineElement, headElement, orientation, headlist}
    ) => {

    let itemlistindexes = Array.from(itemElementMap.keys())
    itemlistindexes.sort((a,b)=>{
        return (a < b)?-1:1
    })
    let headlistindexes = []
    for (let item of headlist) {
        headlistindexes.push(parseInt(item.props.index))
    }
    // console.log('itemlistindexes, headlistindexes',itemlistindexes, headlistindexes)
    let list = []
    let cradleTop = headElement.offsetTop + spineElement.offsetTop, 
        cradleLeft = headElement.offsetLeft + spineElement.offsetLeft
    let scrollblockTopOffset = -viewportElement.scrollTop, 
        scrollblockLeftOffset = -viewportElement.scrollLeft,
        viewportHeight = viewportElement.offsetHeight,
        viewportWidth = viewportElement.offsetWidth,
        viewportTopOffset = -scrollblockTopOffset,
        viewportBottomOffset = -scrollblockTopOffset + viewportHeight

    for (let index of itemlistindexes) {

        let element = itemElementMap.get(index).current
        let inheadlist = headlistindexes.includes(index)
        let top = inheadlist?(element.offsetTop):(((orientation == 'vertical')?headElement.offsetHeight:0) + element.offsetTop), 
            left = inheadlist?(element.offsetLeft):(((orientation == 'horizontal')?headElement.offsetWidth:0) + element.offsetLeft), 
            width = element.offsetWidth, 
            height = element.offsetHeight,
            right = left + width,
            bottom = top + height

        let itemTopOffset = scrollblockTopOffset + cradleTop + top, // offset from top of viewport
            itemBottomOffset = scrollblockTopOffset + cradleTop + bottom, // offset from top of viewport
            itemLeftOffset = scrollblockLeftOffset + cradleLeft + left, 
            itemRightOffset = scrollblockLeftOffset + cradleLeft + right 


        let isVisible = false // default

        let topPortion,
            bottomPortion,
            leftPortion,
            rightPortion

        if ((itemTopOffset < 0) && (itemBottomOffset > 0)) {

            (orientation == 'vertical') && (isVisible = true)
            bottomPortion = itemBottomOffset
            topPortion = bottomPortion - height

        } else if ((itemTopOffset >= 0) && (itemBottomOffset < viewportHeight)) {

            (orientation == 'vertical') && (isVisible = true)
            topPortion = height
            bottomPortion = 0

        } else if ((itemTopOffset > 0) && ((itemTopOffset - viewportHeight) < 0)) {

            (orientation == 'vertical') && (isVisible = true)
            topPortion = viewportHeight - itemTopOffset
            bottomPortion = topPortion - height

        } else {

            if (orientation == 'vertical') continue

        }

        if (itemLeftOffset < 0 && itemRightOffset > 0) {

            (orientation == 'horizontal') && (isVisible = true)
            rightPortion = itemRightOffset
            leftPortion = rightPortion - width

        } else if (itemLeftOffset >= 0 && itemRightOffset < viewportWidth) {

            (orientation == 'horizontal') && (isVisible = true)
            leftPortion = width
            rightPortion = 0

        } else if (itemLeftOffset > 0 && (itemLeftOffset - viewportWidth) < 0) {

            (orientation == 'horizontal') && (isVisible = true)
            leftPortion = viewportWidth - itemLeftOffset
            rightPortion = leftPortion - width

        } else {

            if (orientation == 'horizontal') continue

        }

        let verticalRatio = (topPortion > 0)?topPortion/height:bottomPortion/height,
            horizontalRatio = (leftPortion > 0)?leftPortion/width:rightPortion/height

        let itemData = {

            index,
            isVisible,

            top,
            right,
            bottom,
            left,
            width,
            height,

            itemTopOffset,
            itemBottomOffset,
            topPortion,
            bottomPortion,

            itemLeftOffset,
            itemRightOffset,
            leftPortion,
            rightPortion,

            verticalRatio,
            horizontalRatio,
            
        }

        list.push(itemData)

    }

    return list
}

export const getScrollReferenceIndexData = ({

        viewportData,
        cradleProps,
        crosscount,

    }) => {

    let viewportElement = viewportData.elementref.current
    let {orientation, listsize} = cradleProps
    let scrollPos, cellLength
    if (orientation == 'vertical') {

        scrollPos = viewportElement.scrollTop
        cellLength = cradleProps.cellHeight + cradleProps.gap

    } else {

        scrollPos = viewportElement.scrollLeft
        cellLength = cradleProps.cellWidth + cradleProps.gap

    }

    let referencescrolloffset = cellLength - (scrollPos % cellLength)
    if (referencescrolloffset == cellLength + cradleProps.padding) {
        referencescrolloffset = 0
    }

    let referencerowindex = Math.ceil((scrollPos - cradleProps.padding)/cellLength)
    let referenceindex = referencerowindex * crosscount
    referenceindex = Math.min(referenceindex,listsize - 1)
    let diff = referenceindex % crosscount
    referenceindex -= diff

    let referenceIndexData = {
        index:referenceindex,
        scrolloffset:referencescrolloffset
    }

    if (referenceIndexData.index == 0) referenceIndexData.scrolloffset = 0 // defensive

    return referenceIndexData
}

export const getContentListRequirements = ({
        orientation, 
        cellHeight, 
        cellWidth, 
        cradlerowcount,
        runwaycount,
        gap,
        padding,
        visibletargetindexoffset:referenceoffset,
        targetViewportOffset,
        crosscount,
        listsize,
        viewportElement,
    }) => {

    // reconcile referenceindex to crosscount context
    let diff = referenceoffset % crosscount
    referenceoffset -= diff

    // -------------[ calc basic inputs: cellLength, contentCount. ]----------

    let cellLength,viewportlength
    if (orientation == 'vertical') {
        cellLength = cellHeight + gap
        viewportlength = viewportElement.offsetHeight
    } else {
        cellLength = cellWidth + gap
        viewportlength = viewportElement.offsetWidth
    }
    let viewportrows = Math.floor(viewportlength / cellLength)

    let contentCount = cradlerowcount * crosscount 
    if (contentCount > listsize) contentCount = listsize

    // -----------------------[ calc leadingitemcount, referenceoffset ]-----------------------

    let leadingitemcount = runwaycount * crosscount
    leadingitemcount = Math.min(leadingitemcount, referenceoffset) // for list head

    // -----------------------[ calc indexoffset ]------------------------

    // leading edge
    let indexoffset = referenceoffset - leadingitemcount
    diff = indexoffset % crosscount
    indexoffset -= diff

    // ------------[ adjust indexoffset for underflow ]------------

    diff = 0
    let shift = 0
    if (indexoffset < 0) {
        diff = indexoffset
        shift = Math.floor(diff / crosscount) * crosscount
    }

    if (diff) {
        indexoffset += shift
    }

    // ------------[ adjust indexoffset and contentCount for listsize overflow ]------------

    let spineoffset = targetViewportOffset

    // --------------------[ calc css positioning ]-----------------------

    let indexrowoffset = Math.floor(indexoffset/crosscount)
    let targetrowoffset = Math.floor(referenceoffset/crosscount)
    let maxrowcount = Math.ceil(listsize/crosscount)

    if (maxrowcount < (indexrowoffset + cradlerowcount)) {

        let rowdiff = (indexrowoffset + cradlerowcount) - maxrowcount
        let itemdiff = rowdiff * crosscount
        // targetrowoffset -= rowdiff
        indexoffset -= itemdiff
        // referenceoffset -= itemdiff
        spineoffset = viewportlength - (viewportrows * cellLength)

    }

    let testlistsize = indexoffset + contentCount
    if (testlistsize > listsize) {
        let diff = testlistsize - listsize
        // console.log('testlistsize diff',testlistsize,listsize,diff,contentCount)
        contentCount -= diff
    }

    let scrollblockoffset = (targetrowoffset * cellLength) + gap

    if (targetrowoffset == 0) {
        scrollblockoffset = 0
        spineoffset = padding
    } else {
        spineoffset = adjustSpineOffsetForMaxRefindex({
            spineoffset,
            // referenceoffset,
            targetrowoffset,
            viewportlength,
            listsize,
            viewportrows,
            crosscount,
            cellLength,
            padding,
        })
    }

    return {indexoffset, referenceoffset, contentCount, scrollblockoffset, spineoffset} // summarize requirements message

}

const adjustSpineOffsetForMaxRefindex = ({
    spineoffset:inputspineoffset,
    // referenceoffset,
    targetrowoffset,
    viewportlength,
    listsize,
    viewportrows,
    crosscount,
    cellLength,
    padding,
}) => {
    let spineoffset = inputspineoffset
    let maxrefindexrow = Math.ceil(listsize/crosscount) - viewportrows
    if (targetrowoffset >= maxrefindexrow) {
        spineoffset = viewportlength - ((viewportrows * cellLength) + padding)
    }
    return spineoffset
}

// filter out items that not proximate to the spine
export const isolateRelevantIntersections = ({
    intersections,
    headcontent, 
    tailcontent,
    ITEM_OBSERVER_THRESHOLD,
    scrollforward,
}) => {

    let headindexes = [], 
        tailindexes = [],
        headintersectionindexes = [],
        headintersections = [],
        tailintersectionindexes = [],
        tailintersections = [],
        intersecting:any = {},
        filteredintersections = []

    // collect lists of indexes...
    // headindexes, tailindexes
    for (let component of headcontent) {
        headindexes.push(component.props.index)
    }

    for (let component of tailcontent) {
        tailindexes.push(component.props.index)
    }

    // console.log('headindexes, tailindexes',headindexes, tailindexes)

    // headintersectionindexes, tailintersectionindexes, intersecting
    let duplicates:any = {}
    let intersectionsptr = 0
    for (let entry of intersections) {

        let index = parseInt(entry.target.dataset.index)
        let headptr, tailptr
        if (tailindexes.includes(index)) {

            tailintersectionindexes.push(index)
            tailintersections.push(entry)
            tailptr = tailintersections.length - 1 // used for duplicate resolution

        } else if (headindexes.includes(index)) {

            headintersectionindexes.push(index)
            headintersections.push(entry)
            headptr = headintersections.length - 1 // used for duplicate resolution

        } else {

            console.log('error: unknown intersection element, aborting isolateRelevantIntersections',entry)
            return // shouldn't happen; give up

        }

        let ratio
        if (browser && browser.name == 'safari') {
            ratio = entry.intersectionRatio
        } else {
            ratio = Math.round(entry.intersectionRatio * 1000)/1000
        }

        let calcintersecting = (ratio >= ITEM_OBSERVER_THRESHOLD)
        let iobj = {
            index,
            intersecting:calcintersecting,  // to accommodate browser differences
            isIntersecting:entry.isIntersecting,
            ratio,
            originalratio:entry.intersectionRatio,
            time:entry.time,
            headptr,
            tailptr,
            intersectionsptr,
        }
        if (!intersecting[index]) { // new item
            intersecting[index] = iobj
        } else { // duplicate item
            if (!Array.isArray(intersecting[index])) {
                let arr = [intersecting[index]]
                intersecting[index] = arr
            }
            intersecting[index].push(iobj)
            if (!duplicates[index]) {
                duplicates[index] = []
                duplicates[index].push(intersecting[index][0])
            }
            duplicates[index].push(iobj)
        }
        intersectionsptr++

    }
    // resolve duplicates. For uneven number, keep the most recent
    // otherwise delete them, they cancel each other out.

    let duplicateslength = Object.keys(duplicates).length
    if (duplicateslength > 0) {
        console.log('DUPLICATES found', duplicateslength, duplicates)
        let headintersectionsdelete = [],
            tailintersectionsdelete = []

        for (let duplicateindex in duplicates) {

            let duplicate = duplicates[duplicateindex]

            if (duplicate.length % 2) {
                duplicate.sort(duplicatecompare)
                let entry = duplicate.slice(duplicate.length -1,1)
                intersecting[entry.index] = entry
            } else {
                delete intersecting[duplicate[0].index]
                // intersectingdelete.push(duplicate[0].index)
            }
            for (let entryobj of duplicate) {
                let headptr = entryobj.headptr
                let tailptr = entryobj.tailptr
                if (headptr !== undefined) {
                    headintersectionsdelete.push(headptr)
                }
                if (tailptr !== undefined) {
                    tailintersectionsdelete.push(tailptr)
                }
            }
        }
        if (headintersectionsdelete.length) {
            headintersectionindexes = headintersectionindexes.filter((value, index) => {
                return !headintersectionsdelete.includes(index)
            })
            headintersections = headintersections.filter((value, index) => {
                return !headintersectionsdelete.includes(index)
            })
        }
        if (tailintersectionsdelete.length) {
            tailintersectionindexes = tailintersectionindexes.filter((value, index) => {
                return !tailintersectionsdelete.includes(index)
            })
            tailintersections = tailintersections.filter((value, index) => {
                return !tailintersectionsdelete.includes(index)
            })
        }
    }

    headintersectionindexes.sort(indexcompare)
    tailintersectionindexes.sort(indexcompare)

    headintersections.sort(entrycompare)
    tailintersections.sort(entrycompare)

    // set reference points in relation to the spine
    let headindex = headindexes[headindexes.length - 1]
    let tailindex = tailindexes[0]
    let headptr = headintersectionindexes.indexOf(headindex)
    let tailptr = tailintersectionindexes.indexOf(tailindex)

    // filter out items that register only because they have just been moved
    if (headptr !== (headintersectionindexes.length - 1)) { 
        headptr = -1
    }

    if (tailptr !==0) { 
        tailptr = -1
    }
    if ((headptr > -1) && (tailptr > -1)) { // edge case

        if (scrollforward) {
            headptr = -1
        } else {
            tailptr = -1
        }

    }

    // collect notifications to main thread (filtered intersections)
    // for scrollbackward
    let headrefindex, tailrefindex // for return
    if (!scrollforward && (headptr >= 0)) {
        headrefindex = headintersectionindexes[headptr]
        let refindex = headrefindex + 1
        let refintersecting = intersecting[refindex - 1].intersecting

        for (let ptr = headptr; ptr >= 0; ptr--) {

            let index = headintersectionindexes[ptr]

            // test for continuity and consistency
            if (((index + 1) == refindex) && (intersecting[index].intersecting == refintersecting)) {

                filteredintersections.push(headintersections[ptr])

            } else {

                break

            }

            refindex = index
            refintersecting = intersecting[refindex].intersecting

        }
    }
    // for scrollforward
    if (scrollforward && (tailptr >= 0)) {
        tailrefindex = tailintersectionindexes[tailptr]
        let refindex = tailrefindex - 1
        let refintersecting = intersecting[refindex + 1].intersecting

        for (let ptr = tailptr; ptr < tailintersectionindexes.length; ptr++) {

            let index = tailintersectionindexes[ptr]

            // test for continuity and consistency
            if (((index - 1) == refindex) && (intersecting[index].intersecting == refintersecting)) {

                filteredintersections.push(tailintersections[ptr])

            } else {

                break

            }

            refindex = index
            refintersecting = intersecting[index].intersecting

        }
    }

    filteredintersections.sort(entrycompare) // TODO this should be integrated into the code above

    return filteredintersections //, headrefindex, tailrefindex}

}

let indexcompare = (a,b) => {
    let retval = (a < b)?-1:1
    return retval
}

let entrycompare = (a,b) => {
    let retval = (parseInt(a.target.dataset.index) < parseInt(b.target.dataset.index))? -1:1
    return retval
}

let duplicatecompare = (a,b) => {
    let retval = (a.time < b.time)?-1:1
}


        // let ratio
        // if (browser && browser.name == 'safari') {
        //     ratio = entry.intersectionRatio
        // } else {
        //     ratio = Math.round(entry.intersectionRatio * 1000)/1000
        // }


export const calcContentShifts = ({
    cradleProps,
    spineElement,
    viewportElement,
    headElement,
    tailElement,
    intersections,
    scrollforward,
    crosscount,
    cradlecontentlist,
    tailcontentlist,
    cradlerowcount,
    itemobserverthreshold,
    itemelements,
}) => {

    let forwardcount = 0, backwardcount = 0
    let spineviewportoffset, headspineoffset, tailspineoffset
    let viewportovershoot, viewportlength

    // calculate cradleboundary and boundary row and item count for overshoot

    if (cradleProps.orientation == 'vertical') {
        spineviewportoffset = spineElement.offsetTop - viewportElement.scrollTop
        headspineoffset = headElement.offsetTop
        tailspineoffset = tailElement.offsetTop // always 0
        viewportlength = viewportElement.offsetHeight
        if (scrollforward) {

            viewportovershoot = viewportlength - (spineviewportoffset + tailElement.offsetHeight)

        } else {

            viewportovershoot = spineviewportoffset + headspineoffset // headspineoffset is negative from spine

        }

    } else { // horizontal
        spineviewportoffset = spineElement.offsetLeft - viewportElement.scrollLeft
        headspineoffset = headElement.offsetLeft
        tailspineoffset = tailElement.offsetLeft // always 0
        viewportlength = viewportElement.offsetWidth

        if (scrollforward) {

            viewportovershoot = viewportlength - (spineviewportoffset + tailElement.offsetWidth)

        } else {

            viewportovershoot = spineviewportoffset + headspineoffset

        }
    }

    if (viewportovershoot < 0) viewportovershoot = 0 // not relevant
    if (viewportovershoot > viewportlength) viewportovershoot = viewportlength

    console.log('vertical viewport portion overshoot for scroll',scrollforward?'FORWARD':'BACKWARD',viewportovershoot)

    let gap = cradleProps.gap

    let cellLength = (cradleProps.orientation == 'vertical')?cradleProps.cellHeight + gap:cradleProps.cellWidth + gap
    let overshootrowcount = (viewportovershoot == 0)?0:Math.ceil(viewportovershoot/cellLength) // rows to fill viewport

    // extra rows for runway
    let overshootitemcount = overshootrowcount * crosscount
    if (overshootitemcount) {
        overshootitemcount += (cradleProps.runwaycount * crosscount)
        overshootrowcount += cradleProps.runwaycount
    }

    if (!scrollforward && (overshootitemcount != 0)) { // negation of values for scroll backward
        overshootitemcount = -overshootitemcount
        overshootrowcount = -overshootrowcount
    }

    console.log('OVERSHOOT overshootitemcount, overshootrowcount', overshootitemcount, overshootrowcount)

    // ----------------------[  calculate itemshiftcount includng overshoot ]------------------------
    // shift item count is the number of items the virtual cradle shifts, according to observer notices

    if (scrollforward) {

        backwardcount = intersections.length

    } else {

        forwardcount = intersections.length

    }

    let itemshiftcount = backwardcount - forwardcount + overshootitemcount

    let previousreferenceindex = tailcontentlist[0].props.index
    let previousrefindexcradleoffset = 
        itemelements.get(previousreferenceindex).current.offsetTop + 
        spineElement.offsetTop - viewportElement.scrollTop

    let previouscradleindex = cradlecontentlist[0].props.index

    // console.log('previouscradleindex, previousreferenceindex, cradleitemshiftcount, referenceitemshiftcount', 
    //     previouscradleindex, previousreferenceindex, itemshiftcount)

    let newcradleindex = previouscradleindex + itemshiftcount
    let newreferenceindex = previousreferenceindex + itemshiftcount

    if ((newreferenceindex - newcradleindex) < (cradleProps.runwaycount * crosscount)) {
        newcradleindex = newreferenceindex - (cradleProps.runwaycount * crosscount)
    }

    if (newcradleindex < 0) {
        newcradleindex = 0
    }

    if (newreferenceindex < 0) {
        newreferenceindex = 0
    }

    console.log('first order newcradleindex and newreferenceindex', newcradleindex, newreferenceindex)

    let cradleitemcount = cradlerowcount * crosscount

    let listsize = cradleProps.listsize
    if ((newcradleindex + cradleitemcount) > listsize) {
        let diff = listsize - (newcradleindex + cradleitemcount)
        newcradleindex -= diff
        // console.log('itemshiftcount adjusted down by, to', diff, newcradleindex)
    }

    let viewportrows = Math.floor(viewportlength/cellLength)
    let targetindexrow = newreferenceindex/crosscount
    let maxrefindexrow = Math.ceil(listsize/crosscount) - viewportrows
    if (targetindexrow >= maxrefindexrow) {
        newreferenceindex -= ((targetindexrow - maxrefindexrow) * crosscount)
    }

    let cradleitemshiftcount = newcradleindex - previouscradleindex
    let referenceitemshiftcount = newreferenceindex - previousreferenceindex

    let referenceposshift = (referenceitemshiftcount/crosscount) * cellLength

    console.log('adjusted newcradleindex, shift, and newreferenceindex, shift', 
        newcradleindex, cradleitemshiftcount, newreferenceindex, referenceitemshiftcount)
    console.log('viewport reference pixel offsets old, shift, and new; viewportElement.scrollTop',
        previousrefindexcradleoffset, referenceposshift, previousrefindexcradleoffset + referenceposshift, viewportElement.scrollTop)

    let spineoffset = previousrefindexcradleoffset + referenceposshift

    // if (!scrollforward && (spineoffset >= cellLength)) {

    //     let oldspineoffset = spineoffset
    //     let remainder = spineoffset % cellLength
    //     let rows = Math.floor(spineoffset/cellLength)
    //     let oldreferenceindex = newreferenceindex

    //     console.log('rows',rows, spineoffset, cellLength)

    //     newreferenceindex -= rows * crosscount
    //     spineoffset = remainder
    //     let oldreferenceitemshiftcount = referenceitemshiftcount
    //     referenceitemshiftcount -= rows * crosscount

    //     console.log('adjusting spineoffset down from to',oldspineoffset,spineoffset)
    //     console.log('adjusting newreferenceindex down from to',oldreferenceindex,newreferenceindex)
    //     console.log('adjusting referenceitemshiftcount down from to',oldreferenceitemshiftcount,referenceitemshiftcount)

    // }

    // if (!scrollforward && (spineoffset < 0)) {

    //     let oldspineoffset = spineoffset
    //     let rowadjustment = Math.abs(Math.ceil(-spineoffset/cellLength))
    //     let itemadjustment = rowadjustment * crosscount

    //     console.log('oldspineoffset, rowadjustment, itemadjustment', oldspineoffset, rowadjustment, itemadjustment)

    //     let oldreferenceindex = newreferenceindex
    //     newreferenceindex += itemadjustment
    //     spineoffset = oldspineoffset % cellLength // cellLength - Math.abs(oldspineoffset % cellLength)
    //     let oldreferenceitemshiftcount = referenceitemshiftcount
    //     referenceitemshiftcount += itemadjustment

    //     console.log('adjusting spineoffset up: from to',oldspineoffset,spineoffset)

    //     console.log('adjusting newreferenceindex up from to',oldreferenceindex,newreferenceindex)
        
    //     console.log('adjusting referenceitemshiftcount up from to',oldreferenceitemshiftcount,referenceitemshiftcount)

    // }

    // if (newreferenceindex == 0) spineoffset = 10

    return [newcradleindex, cradleitemshiftcount, newreferenceindex, referenceitemshiftcount, spineoffset] // positive = roll toward top/left; negative = roll toward bottom/right

}

export const calcHeadAndTailChanges = (
    {
        itemshiftcount,
        crosscount,
        headcontent,
        tailcontent,
        scrollforward,
        cradleProps,
        indexoffset,
        cradlerowcount,
        listsize,
    }) => {

    itemshiftcount = Math.abs(itemshiftcount) 
    let rowshiftcount = Math.ceil(itemshiftcount/crosscount) //+ boundaryrowcount

    let headrowcount, tailrowcount
    headrowcount = Math.ceil(headcontent.length/crosscount)
    tailrowcount = Math.ceil(tailcontent.length/crosscount)

    let pendingcontentoffset // lookahead to new indexoffset

    let headchangecount, tailchangecount // the output instructions for getUIContentList

    // anticipaate add to one end, clip from the other        
    let additemcount = 0
    let cliprowcount = 0, clipitemcount = 0

    if (scrollforward) { // clip from head; add to tail; scroll forward head is direction of scroll

        // adjust clipitemcount
        if ((headrowcount + rowshiftcount) > (cradleProps.runwaycount)) {

            let rowdiff = (headrowcount + rowshiftcount) - (cradleProps.runwaycount)
            cliprowcount = rowdiff
            clipitemcount = (cliprowcount * crosscount)

        }

        additemcount = clipitemcount // maintain constant cradle count

        pendingcontentoffset = indexoffset + clipitemcount // after clip

        let proposedtailindex = pendingcontentoffset + (cradlerowcount * crosscount) - 1 // modelcontentlist.length - 1

        // adkjust changes for list boundaries
        if ((proposedtailindex) > (listsize -1) ) {

            let diffitemcount = (proposedtailindex - (listsize -1)) // items outside range
            additemcount -= diffitemcount // adjust the addcontent accordingly
            
            let diffrows = Math.floor(diffitemcount/crosscount) // number of full rows to leave in place
            let diffrowitems = (diffrows * crosscount)  // derived number of items to leave in place

            clipitemcount -= diffrowitems // apply adjustment to netshift

            if (additemcount <=0) { // nothing to do

                additemcount = 0

            }
            if (clipitemcount <=0 ) {

                clipitemcount = 0
                
            }
        }

        headchangecount = -clipitemcount
        tailchangecount = additemcount

    } else { // scroll backward, in direction of tail; clip from tail, add to head

        let intersectionindexes = []

        // headcount will be less than minimum (runwaycount), so a shift can be accomplished[]
        if ((headrowcount - rowshiftcount) < (cradleProps.runwaycount)) {
            // calculate clip for tail
            let rowshortfall = (cradleProps.runwaycount) - (headrowcount - rowshiftcount)

            cliprowcount = rowshortfall
            let tailrowitemcount = (tailcontent.length % crosscount)

            if (tailrowitemcount == 0) tailrowitemcount = crosscount

            clipitemcount = tailrowitemcount
            if (tailrowcount > 1) {

                if (cliprowcount > tailrowcount) {
                    cliprowcount = tailrowcount
                }

                if (cliprowcount > 1) {
                    clipitemcount += ((cliprowcount -1) * crosscount)
                }

            }

            // compenstate with additemcount
            additemcount = (cliprowcount * crosscount)

        }

        let proposedindexoffset = indexoffset - additemcount

        if (proposedindexoffset < 0) {

            let diffitemcount = -proposedindexoffset
            let diffrows = Math.ceil(diffitemcount/crosscount) // number of full rows to leave in place
            let diffrowitems = (diffrows * crosscount)

            additemcount -= diffitemcount
            clipitemcount -= diffrowitems

            if (additemcount <= 0) {

                additemcount = 0
                
            }

            if (clipitemcount <= 0) {

                clipitemcount = 0

            }
        }

        headchangecount = additemcount
        tailchangecount = -clipitemcount

    }
    return [headchangecount,tailchangecount]

}

// update content
// adds itemshells at end of contentlist according to headindexcount and tailindescount,
// or if indexcount values are <0 removes them.
export const getUIContentList = (props) => {

    let { 

        indexoffset, 
        headindexcount, 
        tailindexcount, 
        cradleProps,
        localContentList:contentlist,
        // crosscount,
        listsize,
        callbacks,
        observer,
    } = props

    let orientation = cradleProps.orientation,
        cellHeight = cradleProps.cellHeight,
        cellWidth = cradleProps.cellWidth,
        getItem = cradleProps.getItem,
        placeholder = cradleProps.placeholder

    let localContentlist = [...contentlist]
    let tailindexoffset = indexoffset + contentlist.length
    let returnContentlist

    let headContentlist = []

    if (headindexcount >= 0) {

        for (let index = indexoffset - headindexcount; index < (indexoffset); index++) {

            headContentlist.push(
                emitItem(
                    {
                        index, 
                        orientation, 
                        cellHeight, 
                        cellWidth, 
                        observer, 
                        callbacks, 
                        getItem, 
                        listsize, 
                        placeholder
                    }
                )
            )

        }

    } else {

        localContentlist.splice(0,-headindexcount)

    }

    let tailContentlist = []

    if (tailindexcount >= 0) {

        for (let index = tailindexoffset; index <(tailindexoffset + tailindexcount); index++) {

            tailContentlist.push(
                emitItem(
                    {
                        index, 
                        orientation, 
                        cellHeight, 
                        cellWidth, 
                        observer, 
                        callbacks, 
                        getItem, 
                        listsize, 
                        placeholder
                    }
                )
            )
            
        }

    } else {

        localContentlist.splice(tailindexcount,-tailindexcount)

    }

    returnContentlist = headContentlist.concat(localContentlist,tailContentlist)

    return returnContentlist
}

/*
    Algorithm
    The referenceindex must result in correct spine placement,
    ... and must take into account the bounds of the list for positioning
*/
// export const getNewReferenceindex = ({
//     crosscount,
//     listsize,
//     scrollforward,
//     itemshiftcount,
//     // localcontentlist,
//     // headcontentlist,
//     tailcontentlist,
//     // itemelements,
//     // intersections,
// }) => {

//     let previousreferenceindex = tailcontentlist[0].props.index

//     let referenceindex

//     itemshiftcount = Math.abs(itemshiftcount)

//     let referencerowshift = Math.ceil(itemshiftcount/crosscount)
//     let referenceitemshift = referencerowshift * crosscount

//     if (scrollforward) {

//         referenceindex = previousreferenceindex + referenceitemshift

//     } else {

//         referenceindex = previousreferenceindex - referenceitemshift

//     }

//     if (referenceindex > (listsize -1)) {
//         referenceindex = listsize -1
//     }

//     return [referenceindex, referenceitemshift, previousreferenceindex]
// }

// butterfly model. Leading (head) all or partially hidden; tail, visible plus following hidden
export const allocateContentList = (
    {

        contentlist, // of cradle, in items (React components)
        referenceindex, // first tail item

    }
) => {

    let offsetindex = contentlist[0].props.index

    let headitemcount

    headitemcount = (referenceindex - offsetindex)

    let headlist = contentlist.slice(0,headitemcount)
    let taillist = contentlist.slice(headitemcount)

    return [headlist,taillist]

}

// export const getSpinePortalOffset = (
//     {
//         cradleProps,
//         crosscount,
//         scrollforward,
//         headcontent,
//         itemelements, 
//         referenceindex,
//         previousreferenceindex,
//         referenceshift,
//         viewportElement,
//         spineElement,
//     }) => {

//     // console.log('DIRECTION, incoming referenceindex, previousreferenceindex, referenceshift',
//     //     scrollforward, referenceindex, previousreferenceindex, referenceshift)

//     // ----------[ collect input datas ]----------------

//     let spineoffsetref 

//     let orientation = cradleProps.orientation,
//         padding = cradleProps.padding,
//         gap = cradleProps.gap

//     let spineposbase, cellLength
//     if (orientation == 'vertical') {

//         spineposbase = spineElement.offsetTop
//         cellLength = cradleProps.cellHeight + gap

//     } else {

//         spineposbase = spineElement.offsetLeft
//         cellLength = cradleProps.cellWidth + gap

//     }

//     // ----------------------[ prepare for calculations ]-------------------------------

//     // output vars
//     let referenceposshift = 0 // pixels
//     let scrolloffset

//     // if (orientation == 'vertical') {
        
//     //     if (itemelements.has(referenceindex)) {
//     //         spineoffsetref = spineposbase + itemelements.get(referenceindex).current.offsetTop
//     //     }

//     // } else {

//     //     if (itemelements.has(referenceindex - crosscount)) {
//     //         spineoffsetref = spineposbase + itemelements.get(referenceindex).current.offsetLeft
//     //     }

//     // }

//     // ----------------------[ slightly different calculatoins for forward and back]-----------------

//     let propname = (cradleProps.orientation == 'vertical')?'offsetHeight':'offsetWidth'
//     if (scrollforward) {

//         if (orientation == 'vertical') {
            
//             if (itemelements.has(referenceindex)) {
//                 spineoffsetref = spineposbase + itemelements.get(referenceindex).current.offsetTop
//             }

//         } else {

//             if (itemelements.has(referenceindex - crosscount)) {
//                 spineoffsetref = spineposbase + itemelements.get(referenceindex).current.offsetLeft
//             }

//         }
//         if ( spineoffsetref === undefined ) {
//             for (let rowindex = previousreferenceindex;
//                 rowindex < previousreferenceindex + referenceshift; 
//                 rowindex += crosscount ) {

//                 let iterationshift = itemelements.has(rowindex)
//                     ?itemelements.get(rowindex).current[propname] + gap
//                     :cellLength
//                 referenceposshift += iterationshift

//             }
//             // console.log('inferring forward location for spine offset', referenceposshift)

//             spineoffsetref = spineposbase - referenceposshift

//         }

//         // let scrolloffset

//     } else { // scrollback

//         // TODO add hight headblock reference for first order spineoffsetreference

//         if (orientation == 'vertical') {
            
//             if (itemelements.has(referenceindex)) {
//                  spineoffsetref = spineposbase + itemelements.get(referenceindex).current.offsetTop
//             }

//         } else {

//             if (itemelements.has(referenceindex - crosscount)) {
//                 spineoffsetref = spineposbase + itemelements.get(referenceindex).current.offsetLeft
//             }

//         }

//             // console.log('first order backward spineoffsetref & spineposbase & itemelements.get(referenceindex)?.current.offsetTop', 
//             //     spineoffsetref, spineposbase, itemelements.get(referenceindex)?.current.offsetTop)

    
//             // console.log('processing backward for undefined: previousreferenceindex, referenceshift',previousreferenceindex, referenceshift)

//             for (let rowindex = previousreferenceindex;
//                 rowindex > (previousreferenceindex + referenceshift); 
//                 rowindex -= crosscount ) {

//                 let iterationshift = itemelements.has(rowindex)
//                     ?itemelements.get(rowindex).current[propname] + gap
//                     :cellLength
//                 referenceposshift += iterationshift
//                 // console.log('iterating backshift: rowindex, iterationshift, referenceposshift',rowindex, iterationshift, referenceposshift)

//             }
//             spineoffsetref = spineposbase - referenceposshift
//             // console.log('inferring backward location for spine spineposbase, referenceshift, spineoffsetref', spineposbase,referenceposshift, spineoffsetref)

//         // }

//     }

//     // console.log('spineoffsetref, viewportElement.scrollTop', spineoffsetref, viewportElement.scrollTop)

//     if (cradleProps.orientation == 'vertical') {
//         scrolloffset = spineoffsetref - 
//             viewportElement.scrollTop
            
            
//     } else {

//         scrolloffset = spineoffsetref - 
//             viewportElement.scrollLeft
            
//     }

//     // if (!scrollforward && (scrolloffset > cellLength)) {
//     //     let newscrolloffset = (scrolloffset % cellLength)
//     //     let diff = newscrolloffset - scrolloffset
//     //     scrolloffset = newscrolloffset
//     //     viewportElement.scrollTop += diff
//     // }

    
//     return scrolloffset

// }

const emitItem = ({
    index, 
    orientation, 
    cellHeight, 
    cellWidth, 
    observer, 
    callbacks, 
    getItem, 
    listsize, 
    placeholder
}) => {

    return <ItemShell
        key = {index} 
        orientation = {orientation}
        cellHeight = { cellHeight }
        cellWidth = { cellWidth }
        index = {index}
        observer = {observer}
        callbacks = {callbacks}
        getItem = {getItem}
        listsize = {listsize}
        placeholder = { placeholder }
    />    

}
// ========================================================================================
// ------------------------------------[ styles ]------------------------------------------
// ========================================================================================

export const setCradleGridStyles = ({

    orientation, 
    headCradleStyles:headstylesobject, 
    tailCradleStyles:tailstylesobject,
    cellHeight, 
    cellWidth, 
    gap,
    padding, 
    crosscount, 
    viewportheight, 
    viewportwidth

}) => {

        let headstyles = {...headstylesobject} as React.CSSProperties
        let tailstyles = {...tailstylesobject} as React.CSSProperties

        headstyles.gridGap = gap + 'px'

        tailstyles.gridGap = gap + 'px'

        if (orientation == 'horizontal') {

            headstyles.padding = `${padding}px 0 ${padding}px ${padding}px`

            headstyles.width = 'auto'
            headstyles.height = '100%'
            headstyles.gridAutoFlow = 'column'
            // explict crosscount next line as workaround for FF problem - 
            //     sets length of horiz cradle items in one line (row), not multi-row config
            headstyles.gridTemplateRows = cellHeight?`repeat(${crosscount}, minmax(${cellHeight}px, 1fr))`:'auto'
            headstyles.gridTemplateColumns = 'none'

            tailstyles.padding = `${padding}px ${padding}px ${padding}px 0`

            tailstyles.width = 'auto'
            tailstyles.height = '100%'
            tailstyles.gridAutoFlow = 'column'
            // explict crosscount next line as workaround for FF problem - 
            //     sets length of horiz cradle items in one line (row), not multi-row config
            tailstyles.gridTemplateRows = cellHeight?`repeat(${crosscount}, minmax(${cellHeight}px, 1fr))`:'auto'
            tailstyles.gridTemplateColumns = 'none'

        } else if (orientation == 'vertical') {

            headstyles.padding = `${padding}px ${padding}px 0 ${padding}px`

            headstyles.width = '100%'
            headstyles.height = 'auto'
            headstyles.gridAutoFlow = 'row'
            
            headstyles.gridTemplateRows = 'none'
            headstyles.gridTemplateColumns = cellWidth?`repeat(auto-fit, minmax(${cellWidth}px, 1fr))`:'auto'

            tailstyles.padding = `0 ${padding}px ${padding}px ${padding}px`

            tailstyles.width = '100%'
            tailstyles.height = 'auto'
            tailstyles.gridAutoFlow = 'row'
            
            tailstyles.gridTemplateRows = 'none'
            tailstyles.gridTemplateColumns = cellWidth?`repeat(auto-fit, minmax(${cellWidth}px, 1fr))`:'auto'
            // console.log('setCradleGridStyles vertical, headstyles, tailstyles',headstyles, tailstyles)
        }

        return [headstyles,tailstyles]
        
}

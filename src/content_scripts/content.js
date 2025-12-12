const { createPopper } = require('@popperjs/core/lib/popper-lite')
const { default: flip } = require('@popperjs/core/lib/modifiers/flip')
const { default: preventOverflow } = require('@popperjs/core/lib/modifiers/preventOverflow')

const { BrowserQRCodeReader } = require('@zxing/browser/umd/zxing-browser')
const decoder = new BrowserQRCodeReader()

require('../styles/popover.less')
const prefixCls = 'qrcode-helper'

function injectCss() {
    const url = chrome.runtime.getURL('dist/content_scripts/content.css')
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = url
    document.head.appendChild(link)
}
injectCss()

const cached = new Set()
function isRemoteUrl(text) {
    return /^https?\:\/\//.test(text)
}

function createPopoverDom(text, isIframe) {
    const wrapper = document.createElement('div')
    wrapper.className = `${prefixCls}-popover ${prefixCls}-popover--show`

    const content = document.createElement('div')
    content.className = `${prefixCls}-content`

    const arrow = document.createElement('div')
    arrow.className = `${prefixCls}-arrow`

    const inner = document.createElement('div')
    inner.className = `${prefixCls}-inner`

    if (isIframe) {
        wrapper.classList.add(`${prefixCls}-popover-iframe`)

        const iframeTitle = document.createElement('div')
        iframeTitle.className = `${prefixCls}-inner-title`
        iframeTitle.innerHTML = text

        const iframe = document.createElement('iframe')
        iframe.setAttribute('src', text)
        iframe.setAttribute('referrerpolicy', 'same-origin')

        inner.appendChild(iframeTitle)
        inner.appendChild(iframe)
    } else {
        inner.innerHTML = text
    }

    content.appendChild(arrow)
    content.appendChild(inner)
    wrapper.appendChild(content)

    document.body.appendChild(wrapper)
    return {
        wrapper,
        arrow,
        inner
    }
}
function setTriggerEvents(target, popover, instance) {
    const show = () => {
        popover.classList.add(`${prefixCls}-popover--show`)
        instance.update()
    }
    const hide = () => popover.classList.remove(`${prefixCls}-popover--show`)
    target.addEventListener('mouseleave', hide)
    target.addEventListener('mouseenter', show)
}

function checkQrAspectRatio(img) {
    const ratio = img.width / img.height;
    return ratio >= 0.9 && ratio <= 1.1;
}

async function renderCodeContent(text, target) {
    const isIframe = isRemoteUrl(text)

    const { wrapper } = createPopoverDom(text, isIframe)

    const instance = createPopper(target, wrapper, {
        modifiers: [
            {
                ...flip,
                options: {
                    padding: 16
                }
            },
            {
                ...preventOverflow,
                options: {
                    padding: 8
                }
            }
        ]
    })

    setTriggerEvents(target, wrapper, instance)
    setTriggerEvents(wrapper, wrapper, instance)
}

async function decodeQrCode(img) {
    if (!checkQrAspectRatio(img)) return

    img.crossOrigin = 'anonymous'
    await img.decode()

    decoder.decodeFromImageElement(img).then(result => {
        renderCodeContent(result.text, img)
    }).catch(() => { })
}

document.addEventListener('mouseover', async e => {
    if (e.target.tagName !== 'IMG') return
    if (cached.has(e.target.src)) return
    cached.add(e.target.src)
    decodeQrCode(e.target)
})
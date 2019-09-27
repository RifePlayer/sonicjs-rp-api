var dataService = require('./data.service');
var helperService = require('./helper.service');
var eventBusService = require('./event-bus.service');

var fs = require('fs');
const cheerio = require('cheerio')
const axios = require('axios');
const ShortcodeTree = require('shortcode-tree').ShortcodeTree;
const chalk = require('chalk');
const log = console.log;



module.exports = menuService = {

    startup: function () {
        // console.log('>>=== menu startup');

        eventBusService.on('getRenderedPagePostDataFetch', async function (options) {
            if (options) {
                menuService.getMenu('Main').then(data => {
                    options.page.data.menu = data;
                })
            }
        });
    },

    getMenu: async function (menuName) {
        let menuData = await dataService.getContentByContentTypeAndTitle('menu', menuName);
        let links = menuData.data.links;
        let menu = [];

        for (let index = 0; index < links.length; index++) {
            const item = links[index];

            if (item.level == 0) {
                let hasChildren = this.hasChildren(links, index);

                let childLinks = this.getChildren(links, hasChildren, index);

                menu.push({
                    url: item.url,
                    title: item.title,
                    hasChildren: hasChildren,
                    childLinks: childLinks
                });
            }
        }

        // menuData.data.links.forEach(item => {
        //     menu.push({url: item.url});
        // });

        return menu;
    },

    hasChildren: function (links, currentLinkIndex) {
        if (currentLinkIndex < links.length - 1) {
            let currentLink = links[currentLinkIndex];
            let nextLink = links[currentLinkIndex + 1];
            if (currentLink.level == 0 && nextLink.level == 1) {
                return true;
            }
        }
        return false;
    },


    getChildren: function (links, hasChildren, currentLinkIndex) {
        let childLinks = [];
        if (hasChildren) {

            for (let index = currentLinkIndex + 1; index < links.length; index++) {
                let currentLink = links[index];
                if (currentLink.level == 1) {
                    childLinks.push({
                        url: currentLink.url,
                        title: currentLink.title,
                        hasChildren: false
                    });
                } else {
                    break;
                }
            }
        }

        return childLinks;
    }

}
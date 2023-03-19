import fetch from "node-fetch";
import cheerio from "cheerio";

export default class API{
    constructor(accessToken) {
        this.accessToken = accessToken;
        this.dataProfile;
        this.view_url;
        this.fullData;
        this.headerOptions;
        this.apiPHP;
        this.watchIndex = 3;
    }

    async init(){
        await this.getApiUrl();
        await this.getlHash();
        await this.getProfile();
    }

    async getApiUrl() {
        const url = 'https://api.vk.com/method/apps.getEmbeddedUrl?v=5.131';
        const appId = 7804694;

        try {
            const response = await fetch(`${url}&app_id=${appId}&access_token=${this.accessToken}`);
            const res = await response.json();
            this.view_url = res.response.view_url;
            this.apiPHP = this.view_url.replace('index.php', 'api.php');
        } catch (error) {
            console.error(`Скорее всего вы ввели не правильный accessToken`);
            throw error;
        }
    } // Получение ссылки на приложение
    async getlHash() {
        const urlS = new URL(this.view_url);

        const sign = urlS.searchParams.get("sign");
        const vkTs = urlS.searchParams.get("vk_ts");
        const TokenSettings = urlS.searchParams.get("vk_access_token_settings");
        const vk_are_notifications_enabled = urlS.searchParams.get("vk_are_notifications_enabled");
        const vk_is_app_user = urlS.searchParams.get("vk_is_app_user");
        const vk_is_favorite = urlS.searchParams.get("vk_is_favorite");
        const vk_language = urlS.searchParams.get("vk_language");
        const vk_platform = urlS.searchParams.get("vk_platform");
        const vk_ref = urlS.searchParams.get("vk_ref");
        const vk_user_id = urlS.searchParams.get("vk_user_id");

        const response = await fetch(this.view_url, {
            "headers": {
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
                "sec-ch-ua": "\"Chromium\";v=\"110\", \"Not A(Brand\";v=\"24\", \"Google Chrome\";v=\"110\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "iframe",
                "sec-fetch-mode": "navigate",
                "sec-fetch-site": "cross-site",
                "sec-fetch-user": "?1",
                "upgrade-insecure-requests": "1",
                "Referer": "https://vk.com/",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            "body": null,
            "method": "GET"
        });
        const $ = cheerio.load(await response.text());
        const _0x4782 = $('script').eq(3).text().match(/var _0x4782=([^;]+)/)[1];
        const regex = eval(_0x4782);
        const lhash = regex[6];
        this.fullData = {lhash, sign, vkTs, vk_user_id };
        this.headerOptions = {TokenSettings, vk_are_notifications_enabled, vk_is_app_user, vk_is_favorite, vk_language, vk_platform, vk_ref };
    } // Получение главного хеша со страницы
    async getProfile(){
        const response = await fetch(this.apiPHP, {
            "headers": {
                "accept": "*/*",
                "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                "sec-ch-ua": "\"Chromium\";v=\"110\", \"Not A(Brand\";v=\"24\", \"Google Chrome\";v=\"110\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-requested-with": "XMLHttpRequest",
                "Referer": this.view_url,
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            "body": `notify=false&lhash=${this.fullData.lhash}&im_slave=391808834&system=true&method=info`,
            "method": "POST"
        });
        const res = await response.json();

        this.dataProfile = res;
        this.fullData.rhash = this.dataProfile['res']['hash'];
        return res
    } // Получить данные профиля и rhash
    async getSecretHash(){
        const getSecretHash = await fetch("https://api.vk.com/method/apps.getSecretHash?v=5.204&client_id=6287487", {
            "headers": {
                "accept": "*/*",
                "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
                "content-type": "application/x-www-form-urlencoded",
                "sec-ch-ua": "\"Chromium\";v=\"110\", \"Not A(Brand\";v=\"24\", \"Google Chrome\";v=\"110\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site",
                "Referer": "https://vk.com/",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            "body": `app_id=7804694&request_id=ad&access_token=${this.accessToken}`,
            "method": "POST"
        });
        const getSecretHash_json = await  getSecretHash.json();
        return getSecretHash_json;
    } // Получение хеша для рекламы
    async watchAd(secretHash){
        const sign = `${this.watchIndex},${secretHash.response.ts},${secretHash.response.sign}`;
        const body = `hash=${sign}&method=on_wat%D1%81h%D0%B5d&rhash=${this.fullData.rhash}`
        const watch = await this.sendRequest(body);
        if (watch && watch.color == 'green') {this.watchIndex += 3}
        return watch;
    } // Просмотр рекламы
    async getMarketHashPlayer(id){
        const body = {
            "friends": id,
            "request_hash": null,
            "method": "getMarket.v3",
            "rhash": this.fullData.rhash
        };
        const data = await this.sendRequest(body);
        return data;
    } // Получение основные данные игрока
    async getRating(){
        const body = {
            "method": "load_rating",
            "rhash": this.fullData.rhash
        };
        const data = await this.sendRequest(body);
        const object = {
            "rating_full": eval(data.res.rating),
            "myRating": data.res.myrating
        }
        return object;
    } // Получение рейтинга
    async getUserFullProfile(infoHash){
        const body = {
            "vkid": infoHash[0].id || infoHash[0].vkid,
            "hash": infoHash[0].hash,
            "method": "profile",
            "rhash": this.fullData.rhash
        };
        const data = await this.sendRequest(body);
        return data;
    } // Получение детальной информации о профиле
    async getSalar(){
        const body = {
            "method": "get_salar",
            "rhash": this.fullData.rhash
        };
        const data = await this.sendRequest(body);
        return data;
    } // Собрать голду
    async buySalar(infoHash){
        const body = {
            "vkid": infoHash[0].id || infoHash[0].vkid,
            "hash": infoHash[0].hash,
            "method": "buу",
            "rhash": this.fullData.rhash
        };
        const data = await this.sendRequest(body);
        return data;
    } // Купить раба
    async getFullPeople(){
        const data = {
            "method": "friends.get",
            "format": "json",
            "v": "5.103",
            "user_id": 391808834,
            "access_token": this.accessToken,
        }
        const res = await fetch("https://api.vk.com/method/friends.get", {
            "headers": {
                "accept": "*/*",
                "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
                "content-type": "application/x-www-form-urlencoded",
                "sec-ch-ua": "\"Chromium\";v=\"110\", \"Not A(Brand\";v=\"24\", \"Google Chrome\";v=\"110\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site",
                "Referer": "https://vk.com/",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            "body": new URLSearchParams(data),
            "method": "POST"
        });
        const res_json = await res.json();
        return res_json.response.items;
    } // Получить всех друзей
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async sendRequest(body){
        const watch = await fetch(this.apiPHP, {
            "headers": {
                "accept": "*/*",
                "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                "sec-ch-ua": "\"Chromium\";v=\"110\", \"Not A(Brand\";v=\"24\", \"Google Chrome\";v=\"110\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-requested-with": "XMLHttpRequest",
                "Referer": this.view_url,
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            "body": new URLSearchParams(body),
            "method": "POST"
        });
        return await watch.json();
    }


}


// делить надо на 4-5к
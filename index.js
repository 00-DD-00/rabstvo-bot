import API from './lib/API.js'
import dotenv from 'dotenv';
dotenv.config();

const accessToken = process.env.accessToken;
const api = new API(accessToken);

const slaves = [];
const buyPrice = 100000;
const buySlavesJSON = false;
var money;

async function buySlave() {
    const BUY_PRICE = buyPrice;
    const MAXIMUM_SLAVES = 200;

    while (true) {
        for (const slave of slaves) {
            try {
                // console.log(slave)
                const user_info = await api.getUserFullProfile([slave]);
                const userInfo = user_info.res;
                if (userInfo.cost <= BUY_PRICE) {
                    const buy = await api.buySalar([slave]);

                    if (buy.res == "Успешно!") {
                        console.log(`Куплен раб: ${userInfo.name}[${userInfo.id}] = ${userInfo.cost}p`);
                    } else if (buy.res.includes("Цепи")) {
                        // console.log(`ЦЕПИ!!!`);
                    } else if (buy.res.includes("Нельзя купить больше")) {
                        console.log('SEX');
                        await api.sleep(300000);
                    }else if(buy.res.includes('Недостаточно средств.')){
                        while (money < userInfo.cost){};
                    }else {
                        console.log(buy);
                    }
                }
            } catch (e) {
                console.log(`Error: ${e.message}`);
            }
        }

        if (slaves.length > MAXIMUM_SLAVES) {
            slaves.length = MAXIMUM_SLAVES;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
} //Реализуйте это сами, мне в падлу

async function getSlave() {
    slaves.length = 0;
    const rating = await api.getRating();
    const rating_full = rating.rating_full;

    for (const ratingItem of rating_full) {
        const rat = await api.getMarketHashPlayer(ratingItem.id);
        const rat_full = await api.getUserFullProfile(rat);
        const slavesCount = rat_full.res.slaves.flatMap((slaveItem) =>
            api.getUserFullProfile([{ id: slaveItem.vkid, hash: slaveItem.hash }])
                .then((rat_full_init) =>
                    rat_full_init.res.slaves.map((slavesCountItem) => ({
                        id: slavesCountItem.vkid,
                        hash: slavesCountItem.hash,
                    }))
                )
        );
        try {
            const slavesList = await Promise.all(slavesCount);
            slaves.push(...slavesList.flat());
        } catch (e) {
            console.log(`Block: 4\n${e}`);
        }
    }

    console.log(slaves);
}


async function main() {
    await api.init();
    //if(buySlavesJSON){Promise.all([getSlave(), buySlave()]);};

    // Запуск watchAd() с интервалом 5 секунд
    while (true){
        const secretHash = await api.getSecretHash();
        const result_watch = await api.watchAd(secretHash);
        if (result_watch && result_watch.color != 'green') {
            console.log('Что-то пошло не по плану, перезагрузи.')
            break;
        } else {
            console.log(`\n\n${result_watch.res}\n${result_watch.changes.balance}`);
            money = result_watch.changes.balance;
        }
        await api.sleep(4900)
    }

    // Запуск getMoney() через 5 минут
    // setTimeout(getMoney, 300000, 'funky');
}




main()
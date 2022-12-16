import { NearBindgen, NearPromise, UnorderedMap, near, call, assert, view } from 'near-sdk-js';
import { ONE_NEAR } from 'near-sdk-js/lib/types';

@NearBindgen({})
class Player{
    account: string;
    opportunities: number;

    constructor(account: string, opportunities: number) {
        this.account = account;
        this.opportunities = opportunities;
    }

}

@NearBindgen({})
class LotteryContract{

    players: UnorderedMap<Player> = new UnorderedMap<Player>('l');
    lucky_number: number = 0;
    lottery_status: boolean = false;
    price: number = 1;

    //How calls this function
    //near call $CONTRATO set_lucky_number '{"lucky_number":10,"ticket_price":0.1}' --accountId cuenta.near --amount 1
    @call({payableFunction: true})
    set_lucky_number({lucky_number, ticket_price}:{lucky_number: number, ticket_price: number}): void {

        assert(near.signerAccountId() == "tepic.testnet", "No tienes permisos para ejecutar este comando.");

        this.lucky_number = lucky_number;
        this.price = ticket_price;
        this.lottery_status = true;
    }

    //How calls this function
    //In case that ticket price is 0.1
    //near call $CONTRATO buy_tickets --accountId cuenta.near --amount 0.1
    @call({ payableFunction: true})
    buy_tickets(){

        //Validate if lottery status is true

        const account = near.signerAccountId.toString();
        const deposito = near.attachedDeposit();
        near.log("payment: "+deposito+" price: "+ONE_NEAR);

        assert(Number(deposito) >= this.price, "payment should be equal to ticket price");

        let player = this.players.get(account);

        if(player){
            player.opportunities += 3;
            this.players.set(account, player);
            const {opportunities} = this.players.get(account);
            near.log("player exists and has "+opportunities+" opportunities");
        }else{
            const player = new Player(account, 3);
            this.players.set(account, player);
        }
    }

    //near call $CONTRATO play '{"playNumber":10}' --accountId cuenta.near
    @call({})
    play({playNumber}:{playNumber: number}) {

        assert(this.lottery_status,"Lottery is currently unavailable, try later");

        const account = near.signerAccountId.toString();
        near.log("Account: "+account);

        let player = this.players.get(account);

        if(player){
            assert(player.opportunities >= 1, "Buy new opportunities before play");

            if(this.lucky_number == playNumber){
                NearPromise.new(account).transfer(ONE_NEAR);
                this.lottery_status = false;
                near.log("Congrats you win!");
            }else{
                near.log("Sorry you lost, try again. Good luck!");
            }
            player.opportunities = player.opportunities - 1;
            this.players.set(account, player);
        }
    }

    @view({})
    get_opportunities(): number{
        const account = near.signerAccountId.toString();

        const {opportunities} = this.players.get(account);
        
        return opportunities ? opportunities : 0;
    }

    @view({})
    get_ticket_price(): number {
        return this.price;
    }

    @view({})
    get_number(): number {
        return this.lucky_number;
    }

}
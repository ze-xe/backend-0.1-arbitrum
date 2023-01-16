import { run } from "./app";





if(process.env.NODE_ENV == "test"){
    run("31337")
}else{
    run("421613")
}
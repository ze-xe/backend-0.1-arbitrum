
import joi from "joi";


const createOrderSchemaData = joi.object().keys(
    {
        maker: joi.string().required(),
        token0: joi.string().required(),
        token1: joi.string().required(),
        amount: joi.number().unsafe().required().max(10 ** 100),
        buy: joi.boolean().required(),
        salt: joi.number().required().max(100 ** 10),
        exchangeRate: joi.number().unsafe().required().max(10 ** 100)

    }
);

const createOrderSchema = joi.object(
    {
        createOrderSchemaData: createOrderSchemaData,
        signature: joi.string().required().max(250),
        chainId: joi.string().required().max(50)
    }

);

export{ createOrderSchema };
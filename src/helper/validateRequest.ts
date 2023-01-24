
import joi from "joi";


const createOrderSchemaData = joi.object().keys(
    {
        maker: joi.string().required().max(50),
        token0: joi.string().required().max(50),
        token1: joi.string().required().max(50),
        amount: joi.string().required(),
        orderType: joi.number().required(),
        salt: joi.number().required().max(100 ** 10),
        exchangeRate: joi.string().required().max(50),
        borrowLimit: joi.number().required(),
        loops: joi.number().required()

    }
);

const createOrderSchema = joi.object(
    {
        createOrderSchemaData: createOrderSchemaData,
        signature: joi.string().required().max(250),
        chainId: joi.string().required().max(50)
    }

);

export { createOrderSchema };
export interface Action {
    type: string;
}

export const sayHello: () => Action = () => ({
    type: "HELLO_REACT"
})
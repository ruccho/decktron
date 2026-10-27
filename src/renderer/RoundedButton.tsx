import { MouseEventHandler, ReactNode } from "react";



const RoundedButton: React.FC<{
    children?: ReactNode
    onClick?: MouseEventHandler<HTMLButtonElement>,
    title?: string,
}> = ({ onClick, title, children }) => {

    return (
        <button className="rounded-button" onClick={onClick} title={title}>
            {children}
        </button>
    )

};

export default RoundedButton;

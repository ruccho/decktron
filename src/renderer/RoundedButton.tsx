import { MouseEventHandler, ReactNode } from "react";



const UserIcon: React.FC<{
    children?: ReactNode
    onClick?: MouseEventHandler<HTMLButtonElement>,
}> = ({ onClick, children }) => {

    return (
        <button className="rounded-button" onClick={onClick}>
            {children}
        </button>
    )

};

export default UserIcon;
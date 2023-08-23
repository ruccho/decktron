import { UserData } from "../common";

const UserIcon: React.FC<{
    user?: UserData,
}> = ({ user }) => {

    return (
        <div className="user-icon" style={{
            backgroundImage: `url(${user?.profileImageUrl})`,
        }}>

        </div>
    )

};

export default UserIcon;
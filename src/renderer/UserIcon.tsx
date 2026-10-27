import { UserData } from "../shared/common";

const UserIcon: React.FC<{
    user?: UserData,
}> = ({ user }) => {

    return (
        <div className="user-icon" style={{
            backgroundImage: user ? `url(${user.profileImageUrl})` : undefined,
        }}>

        </div>
    )

};

export default UserIcon;

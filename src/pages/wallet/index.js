
import "./index.css";

import Footer from "../../components/footer";
import Header from "../../components/header";
import WalletSection from "../../components/wallet";

function Wallet() {
	return (
		<div>
			<div className="header_section">
				<Header />
			</div>
			<WalletSection />
			<Footer />
		</div>
	);
}


export default Wallet;